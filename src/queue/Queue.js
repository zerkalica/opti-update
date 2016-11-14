// @flow
import type {IAsyncUpdate} from './interfaces'
import OperationObserver from './OperationObserver'
import type {Transact} from '../interfaces'

export default class Queue {
    _maxQueueSize: number
    _queue: IAsyncUpdate<*>[] = []
    _subscriptions: Subscription[] = []
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
        if (this._subscriptions.length >= this._maxQueueSize) {
            return
        }
        this.retry()
    }

    cancel(): void {
        const subscriptions = this._subscriptions
        for (let i = 0, l = subscriptions.length; i < l; i++) {
            subscriptions[i].unsubscribe()
        }
        this._subscriptions = []

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

    removeSubscription(item: Subscription): void {
        this._subscriptions = this._subscriptions.filter((target: Subscription) => target !== item)
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
        this._subscriptions.push(observer.subscription)
    }
}
