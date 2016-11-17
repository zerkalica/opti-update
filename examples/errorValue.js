// @flow

/**
 * Rollback on promise error
 */
import cellx from 'cellx'
import {RecoverableError, AtomUpdater, UpdaterStatus, GenericAtomSetter} from 'opti-update/index'
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

updater.transaction({
    setter: new GenericAtomSetter(a, aStatus),
    fetcher: {
        type: 'promise',
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
