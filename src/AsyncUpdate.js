// @flow

import type {ISyncUpdate, IAsyncUpdate} from './queue'
import type {Atom, Transact, Loader} from './interfaces'
import UpdaterStatus from './UpdaterStatus'
import type {UpdaterStatusType} from './UpdaterStatus'
import promiseToObservable from './promiseToObservable'

export default class AsyncUpdate<V> {
    _pendingUpdates: ISyncUpdate<*>[] = []

    _transact: Transact
    _loader: Loader<V>
    _lastStatusType: ?UpdaterStatusType
    _isRollbackEnabled: boolean
    _status: Atom<UpdaterStatus>
    _value: Atom<V>

    constructor(
        loader: Loader<V>,
        transact: Transact,
        isRollbackEnabled: boolean
    ) {
        this._loader = loader
        this._transact = transact
        this._isRollbackEnabled = isRollbackEnabled
        this._status = loader.status
        this._value = loader.atom
    }

    _setStatus(type: UpdaterStatusType, error?: ?Error): void {
        if (this._lastStatusType === type) {
            return
        }
        this._lastStatusType = type
        this._status.set(new UpdaterStatus(type, error))
    }

    getObservable(): Observable<V, Error> {
        const l = this._loader
        this._setStatus('pending')
        return l.type === 'promise'
            ? promiseToObservable(l.fetch())
            : l.fetch()
    }

    set(v: V): void {
        this._value.set(v)
    }

    error(e: Error): void {
        this._setStatus('error', e)
    }

    pend(update: ISyncUpdate<*>): void {
        if (this._isRollbackEnabled) {
            this._pendingUpdates.push(update)
        }
    }

    commit(v?: ?V): void {
        this._transact(() => {
            if (v) {
                this._value.set(v)
            }
            this._setStatus('complete')
        })

        this._pendingUpdates = []
    }

    _abort(e: Error): void {
        this._status.set(new UpdaterStatus('error', e))
        const pu = this._pendingUpdates
        for (let i = 0; i < pu.length; i++) {
            pu[i].rollback()
        }
    }

    abort(e: Error): void {
        this._transact(() => this._abort(e))
    }
}

if (0) ((new AsyncUpdate(...(0: any))): IAsyncUpdate<*>) // eslint-disable-line
