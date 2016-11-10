// @flow

import type {SyncUpdate, AsyncUpdate} from './interfaces'
import OperationObserver from './OperationObserver'

export default class AsyncQueue {
    _maxQueueSize: number
    _Queue: AsyncUpdate<*>[] = []
    _subscriptions: Subscription[] = []
    _parentObserver: Observer<SyncUpdate<*>, Error>

    // Readonly Queue size
    size: number = 0

    constructor(
        parentObserver: Observer<SyncUpdate<*>, Error>,
        maxQueueSize: number = 1
    ) {
        this._maxQueueSize = maxQueueSize
        this._parentObserver = parentObserver
    }

    add(ops: AsyncUpdate<*>[]): AsyncQueue {
        const Queue = this._Queue
        for (let i = 0; i < ops.length; i++) {
            Queue.push(ops[i])
        }
        this.size = this.size + ops.length
        return this
    }

    run(): AsyncQueue {
        if (this.size === 0) {
            this._parentObserver.complete()
            return this
        }
        if (this._subscriptions.length >= this._maxQueueSize) {
            return this
        }
        this.continue()
        return this
    }

    _removeSubscription(item: Subscription): void {
        this._subscriptions = this._subscriptions.filter((target: Subscription) => target !== item)
    }

    _runNext = () => {
        this.size = this.size - 1
        this._Queue.pop()
        if (this.size) {
            this.run()
        }
    }

    continue(): AsyncQueue {
        if (!this.size) {
            return this
        }
        const asyncUpdate: AsyncUpdate<*> = this._Queue[this.size - 1]
        const observable = asyncUpdate.fetch()

        let subscription: Subscription

        const unsubscribe = () => this._removeSubscription(subscription)

        const observer = new OperationObserver(
            this._parentObserver,
            unsubscribe,
            this._runNext
        )

        subscription = observable.subscribe(observer)
        this._subscriptions.push(subscription)
        return this
    }

    cancel(): AsyncQueue {
        const subscriptions = this._subscriptions
        for (let i = 0, l = subscriptions.length; i < l; i++) {
            subscriptions[i].unsubscribe()
        }
        this._subscriptions = []
        this._Queue = []
        this.size = 0

        return this
    }
}
