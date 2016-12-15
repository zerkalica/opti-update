// @flow
import type {IAsyncUpdate} from './interfaces'
import OperationObserver from './OperationObserver'
import type {Transact} from '../interfaces'

export default class Queue {
    _queue: IAsyncUpdate<*>[] = []
    _current: number = 0
    _abortOnError: boolean
    _transact: Transact

    constructor(abortOnError: boolean, transact: Transact) {
        this._abortOnError = abortOnError
        this._transact = transact
    }

    run(update: IAsyncUpdate<any>): void {
        this._queue.push(update)
        this._run()
    }

    _run(): void {
        if (this._current >= this._queue.length) {
            return
        }
        if (this._queue[this._current].isSubscribed()) {
            return
        }
        this.retry()
    }

    _reset(): void {
        const queue = this._queue
        for (let i = 0; i < queue.length; i++) {
            const q = queue[i]
            q.unsubscribe()
        }
        this._queue = []
        this._current = 0
    }

    cancel(): void {
        this._reset()
    }

    __abort(err: Error): void {
        const q = this._queue
        const c = this._current
        for (let i = q.length - 1; i >= c; i--) {
            const update = q[i]
            update.abort(err)
        }
        this._queue = []
        this._current = 0
    }

    abort(err: Error): void {
        this._transact(() => this.__abort(err))
    }

    next(): void {
        this._current = this._current + 1
        if (this._current < this._queue.length) {
            this._run()
        } else {
            this._reset()
        }
    }

    getLastUpdate(): ?IAsyncUpdate<*> {
        const q = this._queue
        return q[q.length - 1]
    }

    retry(): void {
        if (this._current >= this._queue.length) {
            return
        }
        const update = this._queue[this._current]
        const observable = update.getObservable()
        const observer = new OperationObserver(
            this,
            update,
            this._abortOnError,
            observable
        )
        update.setSubscription(observable.subscribe(observer))
    }
}
