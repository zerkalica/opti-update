// @flow

import Err from 'es6-error'
import type {IAsyncUpdate, IInternalQueue} from './interfaces'

export default class RecoverableError extends Err {
    orig: Error
    _queue: IInternalQueue
    _update: IAsyncUpdate<*>

    constructor(
        orig: Error,
        queue: IInternalQueue,
        update: IAsyncUpdate<*>
    ) {
        super(orig.message)
        this.stack = orig.stack
        this.orig = orig
        this._queue = queue
        this._update = update
    }

    retry(): void {
        this._queue.retry()
    }

    abort(): void {
        this._update.abort(this.orig)
        this._queue.cancel()
    }
}
