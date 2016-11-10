// @flow

import Err from 'es6-error'

export default class RecoverableError extends Err {
    type: 'recoverable' = 'recoverable'
    orig: Error
    abort: () => void
    retry: () => void

    constructor(
        orig: Error,
        abort: () => void,
        retry: () => void
    ) {
        super(orig.message)
        this.stack = orig.stack
        this.orig = orig
        this.retry = retry
        this.abort = abort
    }
}
