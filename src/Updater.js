// @flow

import {Queue} from './queue'
import type {Atom, Transact, Fetcher, AtomSetter, Canceller} from './interfaces'
import AsyncUpdate from './AsyncUpdate'
import SyncUpdate from './SyncUpdate'

export interface AtomUpdaterOpts {
    abortOnError?: boolean;
    rollback?: boolean;
    transact: Transact;
}

export default class Updater {
    _queue: Queue
    _rollback: boolean
    _transact: Transact

    constructor(opts: AtomUpdaterOpts) {
        this._queue = new Queue(opts.abortOnError || false, opts.transact)
        this._rollback = opts.rollback || false
        this._transact = opts.transact
    }

    addSync<V>(a: Atom<V>, v: V): void {
        const syncUpdate = new SyncUpdate(a, v)
        const lastUpdate = this._queue.getLastUpdate()
        if (lastUpdate) {
            lastUpdate.pend(syncUpdate)
        }
        syncUpdate.set()
    }

    addAsync<V>(fetcher: Fetcher<V>, setter: AtomSetter<V>): Canceller {
        const asyncUpdate = new AsyncUpdate(fetcher, setter, this._transact, this._rollback)
        this._queue.run(asyncUpdate)
        return this._queue
    }
}
