// @flow

import promiseToObservable from './promiseToObservable'
import type {UpdaterStatus, AsyncUpdate, SyncUpdate} from './interfaces'

function createObservableThunk<V>(promiseThunk: () => Promise<V>): () => Observable<V, Error> {
    return function fetch() {
        return promiseToObservable(promiseThunk())
    }
}

export interface Parent {
    addAsyncs(asyncs: AsyncUpdate<*>[], syncs: SyncUpdate<*>[], status: ?UpdaterStatus): void;
}

export default class Transaction {
    _uo: Parent
    _status: ?UpdaterStatus
    _syncs: SyncUpdate<*>[] = []
    _asyncs: AsyncUpdate<*>[] = []

    constructor(uo: Parent) {
        this._uo = uo
    }

    set(value: mixed): Transaction {
        this._syncs.push(value)
        return this
    }

    promise(promiseThunk: () => Promise<*>): Transaction {
        this._asyncs.push(createObservableThunk(promiseThunk))

        return this
    }

    observable(fetch: () => Observable<*, Error>): Transaction {
        this._asyncs.push(fetch)

        return this
    }

    status(status: UpdaterStatus): Transaction {
        this._status = status
        return this
    }

    run(): Transaction {
        this._uo.addAsyncs(this._asyncs, this._syncs, this._status)
        return this
    }
}
