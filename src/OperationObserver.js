// @flow

import type {SyncUpdate} from './interfaces'

export default class OperationObserver {
    _parentObserver: Observer<SyncUpdate<*>, Error>
    _unsubscribe: () => void
    _runNext: () => void

    constructor(
        parentObserver: Observer<SyncUpdate<*>, Error>,
        unsubscribe: () => void,
        runNext: () => void
    ) {
        this._parentObserver = parentObserver
        this._unsubscribe = unsubscribe
        this._runNext = runNext
    }

    next(ops: ?SyncUpdate<*>[]): void {
        if (ops) {
            this._parentObserver.next(ops)
        }
    }

    error(err: Error): void {
        this._unsubscribe()
        this._parentObserver.error(err)
    }

    complete(ops?: SyncUpdate<*>[]): void {
        this._unsubscribe()
        this._runNext()
        if (!ops) {
            this._parentObserver.complete(null)
            return
        }
        this._parentObserver.complete(ops)
    }
}
