// @flow

import {Queue} from './queue'
import SyncUpdate from './SyncUpdate'
import type {Atom, Transact} from './interfaces'
import AsyncUpdate from './AsyncUpdate'

export default class Transaction<F> {
    _queue: Queue
    _updates: SyncUpdate<any>[] = []
    _transact: Transact
    _asyncUpdate: ?AsyncUpdate<any>

    constructor(
        queue: Queue,
        transact: Transact,
        asyncUpdate?: ?AsyncUpdate<F>
    ) {
        this._queue = queue
        this._transact = transact
        this._asyncUpdate = asyncUpdate
    }

    set<V>(atom: Atom<V>, newValue: V): Transaction<F> {
        this._updates.push(new SyncUpdate(atom, newValue))
        return this
    }

    cancel(): void {
        this._queue.cancel(this._asyncUpdate)
        this._updates = []
    }

    _run(): void {
        const updates = this._updates
        const asyncUpdate = this._asyncUpdate
        if (asyncUpdate) {
            this._queue.run(asyncUpdate)
        }
        const lastUpdate = asyncUpdate || this._queue.getLastUpdate()
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i]
            update.set()
            if (lastUpdate) {
                lastUpdate.pend(update)
            }
        }
        this._updates = []
    }

    __run = () => this._run()

    run(): void {
        if (this._updates.length > 1) {
            this._transact(this.__run)
        } else {
            this._run()
        }
    }
}
