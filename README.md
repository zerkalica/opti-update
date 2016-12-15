# opti-update

Framework-agnostic, low-cost optimistic updates with transactions and rollbacks.

What if in browser, todos in todomvc added asyncronously from server updates. How and when to rollback state changes on server error, how to handle multiple fetches in todomvc, when first fetch is running?

opti-update controls atom-values and fetch status. Can be used with any atom-like lirary: [mobx][mobx], [cellx][cellx], [derivable][derivable], [atmover][atmover] etc.

[mobx]: https://github.com/mobxjs/mobx
[cellx]: https://github.com/Riim/cellx
[derivable]: https://github.com/ds300/derivablejs
[atmover]: https://github.com/zerkalica/atmover

```js
// @flow
const updater = new AtomUpdater({
    transact: cellx.transact,
    abortOnError: true,
    rollback: true
})

const transaction = updater.transaction({
    fetcher: {
        fetch() {
            return Promise.reject(new Error('some'))
        }
    },
    setter: new GenericAtomSetter(atom, status)
})
    .set(a, '2')
    .set(b, '2')
    .run()
```

<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Example scenario](#example-scenario)
- [Setup with cellx](#setup-with-cellx)
- [Rollback on promise error](#rollback-on-promise-error)
- [Update on promise success](#update-on-promise-success)
- [Attach all synced updates to last running fetch](#attach-all-synced-updates-to-last-running-fetch)

<!-- /TOC -->
## Example scenario

1. Init a, b, c
2. Update a, b, add fetch a to queue, run fetch a
3. Update b, attach to current fetch a
4. Update c, add fetch c to queue
5. Update b, add fetch b to queue
6. fetch a complete, commit a, run fetch c
7. fetch c error ask user to retry/abort
8. on retry run fetch c, get error and ask again
9. on abort cancel all queue, rollback c to state in 1, b to state in 3

See [complex example](./examples/complex.js)

<img src="https://rawgithub.com/zerkalica/opti-update/master/docs/workflow.svg" alt="opti-update flow diagram" />

## Setup with cellx

```js
// @flow

import cellx from 'cellx'
import {AtomUpdater, UpdaterStatus, RecoverableError} from 'opti-update'
import type {Atom, AtomUpdaterOpts} from 'opti-update'

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
```

## Rollback on promise error

```js
// @flow
//...
updater.transaction({
    setter: new GenericAtomSetter(a, aStatus),
    fetcher: {
        fetch() {
            return Promise.reject(new Error('some'))
        }
    }
})
    .set(a, '2')
    .set(b, '2')
    .run()

/*
c = { type: 'pending', complete: false, pending: true, error: null }
a = 2
b = 2
c = { type: 'error', complete: false, pending: false, error: 'some' }
b = 1
a = 1
 */
```

## Update on promise success

```js
// @flow
//...
updater.transaction({
    setter: new GenericAtomSetter(a, aStatus),
    fetcher: {
        fetch() {
            return Promise.resolve('3')
        }
    }
})
    .set(a, '2')
    .set(b, '2')
    .run()

/*
c = UpdaterStatus { type: 'pending', complete: false, pending: true, error: null }
a = 2
b = 2
a = 3
c = UpdaterStatus { type: 'complete', complete: true, pending: false, error: null }
*/
```

## Attach all synced updates to last running fetch

```js
// @flow
//...
updater.transaction({
    setter: new GenericAtomSetter(a, aStatus),
    fetcher: {
        fetch() {
            return Promise.reject(new Error('some'))
        }
    }
})
    .set(a, '2')
    .set(b, '2')
    .run()

updater.transaction()
    .set(b, '3')
    .run()
/*
c = { type: 'pending', complete: false, pending: true, error: null }
a = 2
b = 2
b = 3
c = { type: 'error', complete: false, pending: false, error: 'some' }
b = 1
a = 1
 */
```
