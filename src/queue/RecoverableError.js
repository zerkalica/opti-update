// @flow

import Err from 'es6-error'
import type {IInternalQueue} from './interfaces'

export default class RecoverableError extends Err {
    orig: Error
    _queue: IInternalQueue

    constructor(
        orig: Error,
        queue: IInternalQueue
    ) {
        super(orig.message)
        this.stack = orig.stack
        this.orig = orig
        this._queue = queue
    }

    retry(): void {
        this._queue.retry()
    }

    abort(): void {
        this._queue.abort(this.orig)
    }
}
