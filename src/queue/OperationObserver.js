// @flow

import type {IAsyncUpdate, IInternalQueue} from './interfaces'
import RecoverableError from './RecoverableError'

export default class OperationObserver<V> {
    _unsubscribe: () => void
    _update: IAsyncUpdate<V>
    _queue: IInternalQueue
    _abortOnError: boolean

    constructor(
        queue: IInternalQueue,
        update: IAsyncUpdate<V>,
        abortOnError: boolean
    ) {
        this._queue = queue
        this._update = update
        this._abortOnError = abortOnError
    }

    next(value: ?V): void {
        if (value) {
            this._update.set(value)
        }
    }

    _cancel(): void {
        this._update.unsubscribe()
    }

    error(err: Error): void {
        this._cancel()
        if (this._abortOnError) {
            this._queue.abort(err)
        } else {
            this._update.error(new RecoverableError(err, this._queue))
        }
    }

    complete(value?: ?V): void {
        this._cancel()
        this._update.commit(value)
        this._queue.next()
    }
}
