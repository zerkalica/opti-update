// @flow
import cellx from 'cellx'

import {RecoverableError, AtomUpdater, UpdaterStatus, GenericAtomSetter} from 'opti-update/index'
import type {Fetcher, Atom, AtomUpdaterOpts} from 'opti-update/index'
import CellxController from 'opti-update/adapters/CellxController'

const Cell = cellx.Cell
cellx.configure({asynchronous: false})

const updater = new AtomUpdater({
    transact: cellx.transact,
    abortOnError: false,
    rollback: true
})

const ctl = new CellxController({
    updater,
    defaultValue: '1',
    loader: ({
        type: 'promise',
        fetch: () => {
            return Promise.resolve('3')
        }
    }: Fetcher<any>)
})

const a = new Cell(ctl.pull, ctl)
const c = new Cell(() => ({
    a: a.get(),
    isPending: a.isPending(),
    error: a.getError()
}))
c.subscribe((err: ?Error, {value}) => {
    console.log('a =', value)
})
console.log('a.get() ===', a.get())
updater.transaction()
    .set(a, '2')
    .run()
