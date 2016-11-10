# opti-update

Framework-agnostic, low-cost optimistic updates with transactions and rollbacks.

## Example with cellx

```js
// @flow

import {Updater, UpdaterStatus, RecoverableError} from 'opti-upadte'
import type {Atom} from 'opti-update'

import cellx from 'cellx'
const Cell = cellx.Cell
const cid = Symbol('cellx:atom')

const getAtom: (v: V) => Atom<V> = (v: Object) => v[cid]
const createQueue = () => new Updater(getAtom, cellx.transact)
```

## Setup

```js
// @flow
type A = {v: number}

const a: A = {v: 1}
a[cid] = new Cell(a)

const aLoadingStatus = new UpdaterStatus('pending')
aLoadingStatus[cid] = new Cell(aLoadingStatus)

const computable = cellx(() => ({
    status: aLoadingStatus[cid].get(),
    a: a[cid].get()
}))

computable.subscribe((err: Error, evt: {type: 'change' | 'error', value: A}) => {
    const {status, a} = evt.value
    if (status.pending) {
        console.log('pending')
    } else if (status.complete) {
        console.log('complete')
    } else if (status.abort) {
        console.log('aborted')
    } if (status.error) {
        console.log('error: ' + status.error.message)
        if (status.error instanceof RecoverableError) {
            if (confirm('Retry?')) {
                console.log('retry')
                status.error.retry()
            } else {
                console.log('abort')
                status.error.abort()
            }
        }
    }
    console.log('value = ' + a.v)
})

const newA: A = {...a, v: 2}

computable.get()
// pending
// value 1
```

## Resolved promise

```js
// @flow

// Resolved promise

const syncedQueue1 = createQueue()

syncedQueue1.transact()
    .set(newA)
    .promise(() => Promise.resolve({...a, v: 3})) // ...a need to keep [cid] property
    .status(aLoadingStatus)
    .run()

const newA2 = {...a, v: 4}
syncedQueue1.transact()
    .set(newA2)
    .promise(() => Promise.resolve({...a, v: 5})) // promises in syncedQueue1 is synchronous queue
    .status(aLoadingStatus)
    .run()

    // pending
    // 2
    // pending
    // 4

    // on next tick, first promise resolved and starting resolve second promise:
    // pending
    // 3

    // on next tick, second promise resolved, no promises in queue, complete:
    // complete
    // 4
```

## Failed promise

```js
// @flow

// Above example, but first promise fails

syncedQueue1.transact()
    .set(newA)
    .promise(() => Promise.reject(new Error('some error')))
    .status(aLoadingStatus) // update this status on queue/promises changes
    .run()

const newA2 = {...a, v: 4}
syncedQueue1.transact()
    .set(newA2)
    .promise(() => Promise.resolve({...a, v: 5})) // promises in syncedQueue1 is synchronous queue
    .run()

    // pending
    // 2
    // pending
    // 4

    // on next tick, first promise fails, second promise never calls
    // error: some error
    // value a = 1 - rollback a
```

## Observables

```js
// @flow

syncedQueue1.transact()
    .set(newA)
    .observable(() => new Observable((o) => {
        let c = 0
        setTimeout(() => {
            a.next(c++)
        }, 300)
    }))
    .status(aLoadingStatus) // update this status on queue/promises changes
    .run()
// ...
```
