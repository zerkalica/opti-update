// @flow

import {Queue} from './queue'
import SyncUpdate from './SyncUpdate'
import type {Atom, Transact, Loader} from './interfaces'
import AsyncUpdate from './AsyncUpdate'

export default class Transaction {
    _queue: Queue
    _updates: SyncUpdate<any>[] = []
    _transact: Transact
    _rollback: boolean

    constructor(
        queue: Queue,
        transact: Transact,
        rollback: boolean
    ) {
        this._queue = queue
        this._transact = transact
        this._rollback = rollback
    }

    set<V>(atom: Atom<V>, newValue: V): Transaction {
        this._updates.push(new SyncUpdate(atom, newValue))
        return this
    }

    _run<V>(loader?: ?Loader<V>): void {
        const updates = this._updates
        if (loader) {
            this._queue.run(new AsyncUpdate(
                loader,
                this._transact,
                this._rollback
            ))
        }
        const lastUpdate = this._queue.getLastUpdate()
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i]
            update.set()
            if (lastUpdate) {
                lastUpdate.pend(update)
            }
        }
    }

    run<V>(loader?: ?Loader<V>): void {
        if (this._updates.length > 1) {
            this._transact(() => this._run(loader))
        } else {
            this._run(loader)
        }
    }
}
