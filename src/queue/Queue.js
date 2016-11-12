// @flow
import type {IAsyncUpdate} from './interfaces'
import OperationObserver from './OperationObserver'

export default class Queue {
    _maxQueueSize: number
    _queue: IAsyncUpdate<*>[] = []
    _subscriptions: Subscription[] = []
    _current: number = 0
    _abortOnError: boolean

    constructor(abortOnError: boolean, maxQueueSize?: ?number) {
        this._maxQueueSize = maxQueueSize || 1
        this._abortOnError = abortOnError
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
