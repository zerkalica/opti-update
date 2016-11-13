// @flow

/**
 * Rollback on promise error
 */

import {RecoverableError} from 'opti-update/index'
import cellx from 'cellx'

import {AtomUpdater, UpdaterStatus} from 'opti-update/index'
import type {Atom, AtomUpdaterOpts} from 'opti-update/index'

const Cell = cellx.Cell
cellx.configure({asynchronous: false})

const updater = new AtomUpdater({
    transact: cellx.transact,
    abortOnError: true,
    rollback: true
})

const a = new Cell('1')
const b = new Cell('1')
const aStatus = new Cell(new UpdaterStatus('pending'))

a.subscribe((err: ?Error, {value}) => {
    console.log('a =', value)
})
b.subscribe((err: ?Error, {value}) => {
    console.log('b =', value)
})
aStatus.subscribe((err: ?Error, {value}) => {
    console.log('c =', {...value, error: value.error ? value.error.message : null})
})

updater.transaction()
    .set(a, '2')
    .set(b, '2')
    .run({
        type: 'promise',
        atom: a,
        status: aStatus,
        fetch() {
            return Promise.reject(new Error('some'))
        }
    })

/*
c = { complete: false, pending: true, error: null }
a = 2
b = 2
c = { complete: false, pending: false, error: 'some' }
a = 1
b = 1
 */
