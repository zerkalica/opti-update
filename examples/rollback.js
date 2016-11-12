// @flow

/**
 * Transactionally change multiple atoms and rollback on error
 */

import {RecoverableError} from 'opti-update/index'
import initUpdater from './initUpdater'
const {computable, aStatus, a, b, c, updater} = initUpdater()

computable.subscribe((err: ?Error, {value}) => {
    console.log('\nlistener:\n', value, '\n')
})

let fetchCount: number = 0
console.log('update a, b, set status.pending:')
updater.transaction()
    .set(a, {v: 'a-2'})
    .set(b, {v: 'b-2'})
    .run({
        type: 'promise',
        atom: a,
        status: aStatus,
        fetch: () => {
            console.log(`start fetch #${++fetchCount}`)
            return Promise.reject(new Error('some error'))
        },
    })

console.log('update c:')
updater.transaction()
    .set(c, {v: 'c-1'})
    .run()

console.log('status.error is RecoverableError on next tick:')
setTimeout(() => {
    console.log('User calls retry: status.pending again')
    const err = aStatus.get().error
    if (!(err instanceof RecoverableError)) {
        throw new Error('Something wrong')
    }

    err.retry()

    console.log('status.error is RecoverableError on next tick again:')
    setTimeout(() => {
        const err = aStatus.get().error
        console.log('User calls abort: restoring a, b, c, status.error is Error on next tick')
        if (!(err instanceof RecoverableError)) {
            throw new Error('Something wrong')
        }
        err.abort()
    }, 0)
}, 0)

// npm run ex.syncServer

/*
update a, b, set status.pending:
start fetch #1

listener:
 { status: { complete: false, pending: true, error: null },
  a: { v: 'a-2' },
  b: { v: 'b-2' },
  c: { v: 'c' } }

update c:

listener:
 { status: { complete: false, pending: true, error: null },
  a: { v: 'a-2' },
  b: { v: 'b-2' },
  c: { v: 'c-1' } }

status.error is RecoverableError on next tick:

listener:
 { status:
   { complete: false,
     pending: false,
     error: { message: 'some error', name: 'RecoverableError' } },
  a: { v: 'a-2' },
  b: { v: 'b-2' },
  c: { v: 'c-1' } }

User calls retry: status.pending again

listener:
 { status: { complete: false, pending: true, error: null },
  a: { v: 'a-2' },
  b: { v: 'b-2' },
  c: { v: 'c-1' } }

start fetch #2
status.error is RecoverableError on next tick again:

listener:
 { status:
   { complete: false,
     pending: false,
     error: { message: 'some error', name: 'RecoverableError' } },
  a: { v: 'a-2' },
  b: { v: 'b-2' },
  c: { v: 'c-1' } }

User calls abort: restoring a, b, c, status.error is Error on next tick

listener:
 { status:
   { complete: false,
     pending: false,
     error: { message: 'some error', name: 'Error' } },
  a: { v: 'a' },
  b: { v: 'b' },
  c: { v: 'c' } }
 */
