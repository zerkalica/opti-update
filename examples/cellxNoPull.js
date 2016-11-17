// @flow

/**
 * Attach all synced updates to last running fetch
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
const aStatus = new Cell(new UpdaterStatus('pending'))

updater.transaction({
    setter: new GenericAtomSetter(a, aStatus),
    fetcher: {
        type: 'promise',
        fetch() {
            return Promise.resolve('3')
        }
    }
})
    .run()

const c = new Cell(() => ({
    a: a.get(),
    isPending: aStatus.get().pending,
    error: aStatus.get().erorr
}))
c.subscribe((err: ?Error, {value}) => {
    console.log('a =', value)
})
console.log('a.get() ===', a.get())
updater.transaction()
    .set(a, '2')
    .run()
/*
a.get() === 1
a = { a: '2', isPending: true, error: undefined }
a = { a: '3', isPending: false, error: undefined }
 */
