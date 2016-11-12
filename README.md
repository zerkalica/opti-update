# opti-update

Framework-agnostic, low-cost optimistic updates with transactions and rollbacks.

<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Examples](#examples)
- [Init](#init)
- [Transactionally change multiple atoms and rollback on error](#transactionally-change-multiple-atoms-and-rollback-on-error)

<!-- /TOC -->

## Examples
    * Rollback data on failed promise: ``` npm run ex.rollback ```


## Init

```js
// @flow
// Init Updater
/* eslint-disable no-console */

import cellx from 'cellx'

import {AtomUpdater, UpdaterStatus} from 'opti-update/index'
import type {Atom, AtomUpdaterOpts} from 'opti-update/index'

const Cell = cellx.Cell
cellx.configure({asynchronous: false})

export interface Some {
    v: string;
}

export interface IComputable {
    a: Some;
    b: Some;
    c: Some;
    status: UpdaterStatus;
}

function toJs(err: Error): Object {
    return {
        message: err.message,
        name: err.name
    }
}

export interface ExampleSettings {
    a: Atom<Some>;
    b: Atom<Some>;
    c: Atom<Some>;
    aStatus: Atom<UpdaterStatus>;
    computable: Cell<IComputable>;
    updater: AtomUpdater;
}

export default function initUpdater(): ExampleSettings {
    const a: Atom<Some> = new Cell({v: 'a'})
    const b: Atom<Some> = new Cell({v: 'b'})
    const c: Atom<Some> = new Cell({v: 'c'})

    const aStatus: Atom<UpdaterStatus> = new Cell(new UpdaterStatus('pending'))

    const computable: Cell<IComputable> = new Cell(() => {
        const status = aStatus.get()

        return {
            status: {
                ...status,
                error: status.error ? toJs(status.error) : null
            },
            a: a.get(),
            b: b.get(),
            c: c.get()
        }
    })

    const opts: AtomUpdaterOpts = {
        transact: cellx.transact,
        abortOnError: false,
        rollback: true
    }

    const updater = new AtomUpdater(opts)

    return {
        updater,
        a,
        b,
        c,
        aStatus,
        computable
    }
}
```

## Transactionally change multiple atoms and rollback on error

```js
// @flow
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
```

Output:

```
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
```
