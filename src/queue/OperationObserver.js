// @flow

import type {IAsyncUpdate, IInternalQueue} from './interfaces'
import RecoverableError from './RecoverableError'

export default class OperationObserver<V> {
    _unsubscribe: () => void
    update: IAsyncUpdate<V>
    _queue: IInternalQueue
    _abortOnError: boolean

    subscription: Subscription

    constructor(
        queue: IInternalQueue,
        update: IAsyncUpdate<V>,
        abortOnError: boolean
    ) {
        this._queue = queue
        this.update = update
        this._abortOnError = abortOnError
    }

    next(value: ?V): void {
        if (value) {
            this.update.set(value)
        }
    }

    _unsubscribe(): void {
        this._queue.removeSubscription(this)
    }

    error(err: Error): void {
        this._unsubscribe()
        if (this._abortOnError) {
            this._queue.abort(err)
        } else {
            this.update.error(new RecoverableError(err, this._queue))
        }
    }

    complete(value?: ?V): void {
        this._unsubscribe()
        this.update.commit(value)
        this._queue.next()
    }
}
