// @flow

import {Queue} from './queue'
import type {Transact, Fetcher, AtomSetter} from './interfaces'
import Transaction from './Transaction'
import AsyncUpdate from './AsyncUpdate'

export interface AtomUpdaterOpts {
    transact: Transact;
    abortOnError?: boolean;
    rollback?: boolean;
}

interface TransactionOpts<V> {
    fetcher: Fetcher<V>;
    setter: AtomSetter<V>;
}
export default class AtomUpdater {
    _queue: Queue
    _transact: Transact
    _rollback: boolean

    constructor(opts: AtomUpdaterOpts) {
        this._queue = new Queue(opts.abortOnError || false, opts.transact)
        this._transact = opts.transact
        this._rollback = opts.rollback || false
    }

    transaction<V>(opts?: ?TransactionOpts<V>): Transaction<V> {
        return new Transaction(
            this._queue,
            this._transact,
            opts
                ? new AsyncUpdate(opts.fetcher, opts.setter, this._transact, this._rollback)
                : null
        )
    }
}
