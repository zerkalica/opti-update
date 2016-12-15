// @flow

import type {ISyncUpdate, IAsyncUpdate} from './queue'
import type {AtomSetter, Transact, Fetcher} from './interfaces'
import promiseToObservable from './promiseToObservable'

export default class AsyncUpdate<V> {
    _pendingUpdates: ISyncUpdate<*>[] = []

    _transact: Transact
    _fetcher: Fetcher<V>
    _isRollbackEnabled: boolean
    _atomSetter: AtomSetter<V>

    _subscription: ?Subscription

    constructor(
        fetcher: Fetcher<V>,
        setter: AtomSetter<V>,
        transact: Transact,
        isRollbackEnabled: boolean
    ) {
        this._fetcher = fetcher
        this._transact = transact
        this._isRollbackEnabled = isRollbackEnabled
        this._atomSetter = setter
    }

    setSubscription(subscription: Subscription): void {
        this._subscription = subscription
    }

    isSubscribed(): boolean {
        return !!this._subscription
    }

    unsubscribe(): void {
        if (this._subscription) {
            this._subscription.unsubscribe()
            this._subscription = null
        }
    }

    getObservable(): Observable<V, Error> {
        const fetcher = this._fetcher
        this._atomSetter.pending()

        return fetcher.fetch
            ? promiseToObservable(fetcher.fetch())
            : fetcher.observable()
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
        this.unsubscribe()
        this._atomSetter.error(e)
        const pu = this._pendingUpdates
        for (let i = pu.length - 1; i >= 0; i--) {
            pu[i].rollback()
        }
    }
}

if (0) ((new AsyncUpdate(...(0: any))): IAsyncUpdate<*>) // eslint-disable-line
