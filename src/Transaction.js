// @flow

import {Queue} from './queue'
import SyncUpdate from './SyncUpdate'
import type {Atom, Transact, Updater} from './interfaces'
import AsyncUpdate from './AsyncUpdate'

export default class Transaction<F> {
    _queue: Queue
    _updates: SyncUpdate<any>[] = []
    _transact: Transact
    _rollback: boolean
    _updater: ?Updater<F>

    constructor(
        queue: Queue,
        transact: Transact,
        rollback: boolean,
        updater?: ?Updater<F>
    ) {
        this._queue = queue
        this._transact = transact
        this._rollback = rollback
        this._updater = updater
    }

    set<V>(atom: Atom<V>, newValue: V): Transaction<F> {
        this._updates.push(new SyncUpdate(atom, newValue))
        return this
    }

    _run(): void {
        const updates = this._updates
        let asyncUpdate: ?AsyncUpdate<F>
        if (this._updater) {
            asyncUpdate = new AsyncUpdate(
                this._updater,
                this._transact,
                this._rollback
            )
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
