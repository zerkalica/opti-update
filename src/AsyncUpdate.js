// @flow

import type {ISyncUpdate, IAsyncUpdate} from './queue'
import type {AtomSetter, Transact, Updater, Fetcher} from './interfaces'
import type {UpdaterStatusType} from './UpdaterStatus'
import promiseToObservable from './promiseToObservable'

export default class AsyncUpdate<V> {
    _pendingUpdates: ISyncUpdate<*>[] = []

    _transact: Transact
    _fetcher: Fetcher<V>
    _lastStatusType: ?UpdaterStatusType
    _isRollbackEnabled: boolean
    _atomSetter: AtomSetter<V>

    constructor(
        updater: Updater<V>,
        transact: Transact,
        isRollbackEnabled: boolean
    ) {
        this._fetcher = updater.fetcher
        this._transact = transact
        this._isRollbackEnabled = isRollbackEnabled
        this._atomSetter = updater.setter
    }

    getObservable(): Observable<V, Error> {
        const fetcher = this._fetcher
        this._atomSetter.pending()

        return fetcher.type === 'promise'
            ? promiseToObservable(fetcher.fetch())
            : fetcher.fetch()
    }

    set(v: V): void {
        this._atomSetter.next(v)
    }

    error(e: Error): void {
        this._atomSetter.error(e)
    }

    pend(update: ISyncUpdate<*>): void {
        if (this._isRollbackEnabled) {
            this._pendingUpdates.push(update)
        }
    }

    commit(v?: ?V): void {
        this._transact(() => {
            if (v) {
                this._atomSetter.next(v)
            }
            this._atomSetter.complete()
        })

        this._pendingUpdates = []
    }

    abort(e: Error): void {
        this._atomSetter.error(e)
        const pu = this._pendingUpdates
        for (let i = pu.length - 1; i >= 0; i--) {
            pu[i].rollback()
        }
    }
}

if (0) ((new AsyncUpdate(...(0: any))): IAsyncUpdate<*>) // eslint-disable-line
