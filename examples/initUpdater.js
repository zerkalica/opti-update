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
