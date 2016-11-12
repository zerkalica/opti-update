// @flow

import {Queue} from './queue'
import type {Transact} from './interfaces'
import Transaction from './Transaction'

export interface AtomUpdaterOpts {
    transact: Transact;
    abortOnError?: boolean;
    rollback?: boolean;
}

export default class AtomUpdater {
    _queue: Queue
    _transact: Transact
    _rollback: boolean

    constructor(opts: AtomUpdaterOpts) {
        this._queue = new Queue(opts.abortOnError || false)
        this._transact = opts.transact
        this._rollback = opts.rollback || false
    }

    cancel(): AtomUpdater {
        this._queue.cancel()
        return this
    }

    transaction(): Transaction {
        return new Transaction(this._queue, this._transact, this._rollback)
    }
}
