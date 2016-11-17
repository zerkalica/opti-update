// @flow
import type {IAsyncUpdate} from './interfaces'
import OperationObserver from './OperationObserver'
import type {Transact} from '../interfaces'

export default class Queue {
    _maxQueueSize: number
    _queue: IAsyncUpdate<*>[] = []
    _observers: OperationObserver<*>[] = []
    _current: number = 0
    _abortOnError: boolean
    _transact: Transact

    constructor(abortOnError: boolean, transact: Transact, maxQueueSize?: ?number) {
        this._maxQueueSize = maxQueueSize || 1
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
        if (this._observers.length >= this._maxQueueSize) {
            return
        }
        this.retry()
    }

    cancel(asyncUpdate?: ?IAsyncUpdate<*>): void {
        const observers = asyncUpdate
            ? this._observers.filter((obs: OperationObserver<*>) => obs.update === asyncUpdate)
            : this._observers

        for (let i = 0, l = observers.length; i < l; i++) {
            observers[i].subscription.unsubscribe()
        }
        this._observers = []

        this._queue = []
        this._current = 0
    }

    __abort(err: Error): void {
        const q = this._queue
        const c = this._current
        for (let i = q.length - 1; i >= c; i--) {
            q[i].abort(err)
        }
        this.cancel()
    }

    abort(err: Error): void {
        this._transact(() => this.__abort(err))
    }

    removeSubscription(item: OperationObserver<*>): void {
        this._observers = this._observers.filter((target: OperationObserver<*>) => target !== item)
    }

    next(): void {
        this._current = this._current + 1
        if (this._current < this._queue.length) {
            this._run()
        } else {
            this.cancel()
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
            this._abortOnError
        )

        observer.subscription = observable.subscribe(observer)
        this._observers.push(observer)
    }
}
