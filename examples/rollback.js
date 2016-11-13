// @flow

/**
 * Transactionally change multiple atoms and rollback on error
 *
 * Scenario:
 *
 * 1. Init a, b, c
 * 2. Update a, b, add fetch a to queue, run fetch a
 * 3. Update b, attach to current fetch a
 * 4. Update c, add fetch c to queue
 * 5. Update b, add fetch b to queue
 * 6. fetch a complete, commit a, run fetch c
 * 7. fetch c error ask user to retry/abort
 * 8. on retry run fetch c, get error and ask again
 * 9. on abort cancel all queue, rollback c to 1, b to 3
 */

import {RecoverableError} from 'opti-update/index'
import cellx from 'cellx'

import {AtomUpdater, UpdaterStatus} from 'opti-update/index'
import type {Atom, AtomUpdaterOpts} from 'opti-update/index'

const Cell = cellx.Cell
cellx.configure({asynchronous: false})

const updater = new AtomUpdater({
    transact: cellx.transact,
    abortOnError: false,
    rollback: true
})

const a = new Cell('1')
const b = new Cell('1')
const c = new Cell('1')
const aStatus = new Cell(new UpdaterStatus('pending'))
const computed = new Cell(() => {
    const status = aStatus.get()
    return {
        status: {
            ...status,
            error: status.error
                ? `${status.error.name}`
                : null
        },
        values: {
            a: a.get(),
            b: b.get(),
            c: c.get()
        }
    }
})
computed.subscribe((err: ?Error, {value}) => {
    console.log(value.values)
    console.log(value.status)
})

console.log('start:')
console.log(computed.get().values)
console.log(computed.get().status)

console.log('\nupdate a, b')
updater.transaction()
    .set(a, '2')
    .set(b, '2')
    .run({
        type: 'promise',
        atom: a,
        status: aStatus,
        fetch() {
            return Promise.resolve('3')
        }
    })

updater.transaction()
    .set(b, '3')
    .run()

let fetchCount: number = 0
console.log('\nupdate c')
updater.transaction()
    .set(c, '2')
    .run({
        type: 'promise',
        atom: c,
        status: aStatus,
        fetch() {
            console.log(`\nfetch c #${++fetchCount}`)
            return Promise.reject(new Error('some error'))
        }
    })

console.log('\nupdate b')
updater.transaction()
    .set(b, '4')
    .run({
        type: 'promise',
        atom: b,
        status: aStatus,
        fetch() {
            return Promise.resolve('5')
        }
    })

console.log('\nfetching')
setTimeout(() => {
    const err = aStatus.get().error
    if (!(err instanceof RecoverableError)) {
        throw new Error('Something wrong')
    }

    console.log('\nUser calls retry')
    err.retry()

    setTimeout(() => {
        const err = aStatus.get().error
        console.log('\nUser calls abort: rollback c, b')
        if (!(err instanceof RecoverableError)) {
            throw new Error('Something wrong')
        }
        err.abort()
    }, 0)
}, 0)

/*
start:
{ a: '1', b: '1', c: '1' }
{ complete: false, pending: true, error: null }

update a, b
{ a: '2', b: '2', c: '1' }
{ complete: false, pending: true, error: null }
{ a: '2', b: '3', c: '1' }
{ complete: false, pending: true, error: null }

update c
{ a: '2', b: '3', c: '2' }
{ complete: false, pending: true, error: null }

update b
{ a: '2', b: '4', c: '2' }
{ complete: false, pending: true, error: null }

fetching
{ a: '3', b: '4', c: '2' }
{ complete: true, pending: false, error: null }
{ a: '3', b: '4', c: '2' }
{ complete: false, pending: true, error: null }

fetch c #1
{ a: '3', b: '4', c: '2' }
{ complete: false, pending: false, error: 'RecoverableError' }

User calls retry
{ a: '3', b: '4', c: '2' }
{ complete: false, pending: true, error: null }

fetch c #2
{ a: '3', b: '4', c: '2' }
{ complete: false, pending: false, error: 'RecoverableError' }

User calls abort: rollback c, b
{ a: '3', b: '3', c: '1' }
{ complete: false, pending: false, error: 'Error' }
*/
