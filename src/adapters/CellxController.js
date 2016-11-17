// @flow

import AtomUpdater from '../AtomUpdater'
import type {Fetcher} from '../interfaces'
import Transaction from '../Transaction'

type PullFn<V> = (push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V) => V
type PutFn<V> = (value: V, push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V) => void

class CellxPullAtomSetter<V> {
    next: (v: V) => void
    error: (err: Error) => void;

    constructor(
        push: (v: V) => void,
        fail: (v: Error) => void
    ) {
        this.next = push
        this.error = fail
    }

    pending(): void {
        // isPending controlled by cellx itself
    }

    complete(): void {
        // isPending controlled by cellx itself
    }
}

interface CellxUpdaterOpts<V> {
    updater: AtomUpdater;
    defaultValue: V;
    loader?: Fetcher<V>;
    saver?: Fetcher<V>;
}

export default class CellxController<V> {
    _updater: AtomUpdater
    _loader: ?Fetcher<V>
    _saver: ?Fetcher<V>
    _defaultValue: V
    _transaction: ?Transaction<V>

    pull: ?PullFn<V>
    put: ?PutFn<V>

    constructor(
        opts: CellxUpdaterOpts<V>
    ) {
        this._updater = opts.updater
        this._loader = opts.loader
        this._saver = opts.saver
        this._defaultValue = opts.defaultValue
        if (opts.saver) {
            this.put = (value: V, push: (v: V) => void, fail: (e: Error) => void) =>
                this._put(value, push, fail)
            return
        }
        if (opts.loader) {
            this.pull = (push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V) =>
                this._pull(push, fail, oldValue)
            return
        }
    }

    _pull(push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V): V {
        if (!this._loader) {
            return this._defaultValue
        }
        this._transaction = this._updater.transaction({
            fetcher: this._loader,
            setter: new CellxPullAtomSetter(push, fail)
        })

        this._transaction.run()

        return oldValue || this._defaultValue
    }

    _put(value: V, push: (v: V) => void, fail: (e: Error) => void): void {
        if (!this._saver) {
            return
        }
        this._transaction = this._updater.transaction({
            fetcher: this._saver,
            setter: new CellxPullAtomSetter(push, fail)
        })
        this._transaction.run()
    }

    reap(): void {
        if (this._transaction) {
            this._transaction.cancel()
        }
    }
}
