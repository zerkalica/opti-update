# opti-update

Framework-agnostic, low-cost optimistic updates with transactions and rollbacks.

<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Setup with cellx](#setup-with-cellx)
- [Rollback on promise error](#rollback-on-promise-error)
- [Update on promise success](#update-on-promise-success)
- [Attach all synced updates to last running fetch](#attach-all-synced-updates-to-last-running-fetch)
- [More examples](#more-examples)

<!-- /TOC -->


## Setup with cellx

```js
// @flow

/**
 * Auto rollback on error
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
```

## Rollback on promise error

```js
// @flow
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
```

## Update on promise success

```js
// @flow
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
    console.log('c =', value)
})

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

/*
c = UpdaterStatus { complete: false, pending: true, error: null }
a = 2
b = 2
a = 3
c = UpdaterStatus { complete: true, pending: false, error: null }
 */
```

## Attach all synced updates to last running fetch

```js
// @flow
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

updater.transaction()
    .set(b, '3')
    .run()
/*
c = { complete: false, pending: true, error: null }
a = 2
b = 2
b = 3
c = { complete: false, pending: false, error: 'some' }
a = 1
b = 1
 */
```

## More examples
    * Set a, b and load a via promise: npm run ex.changeValue
    * Rollback data on failed promise: npm run ex.rollback
