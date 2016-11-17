// @flow

import AtomUpdater from '../AtomUpdater'
import type {Fetcher} from '../interfaces'

type PullFn<V> = (push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V) => V

class CellxPullAtomSetter<V> {
    _push: (v: V) => void
    _fail: (v: Error) => void

    constructor(
        push: (v: V) => void,
        fail: (v: Error) => void
    ) {
        this._push = push
        this._fail = fail
    }

    pending(): void {
        // isPending controlled by cellx itself
    }

    complete(): void {
        // isPending controlled by cellx itself
    }

    next(v: V): void {
        this._push(v)
    }

    error(err: Error): void {
        this._fail(err)
    }
}

export class CellxUpdater<V> {
    _updater: AtomUpdater
    _loader: ?Fetcher<V>
    _saver: ?Fetcher<V>
    _defaultValue: V

    constructor(
        updater: AtomUpdater,
        defaultValue: V,
        loader?: ?Fetcher<V>,
        saver?: ?Fetcher<V>
    ) {
        this._updater = updater
        this._loader = loader
        this._saver = saver
        this._defaultValue = defaultValue
    }

    _pull(push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V): V {
        if (!this._loader) {
            return this._defaultValue
        }
        this._updater.transaction({
            fetcher: this._loader,
            setter: new CellxPullAtomSetter(push, fail)
        })
            .run()

        return oldValue || this._defaultValue
    }

    put(value: V, push: (v: V) => void, fail: (e: Error) => void): void {
        if (!this._saver) {
            return
        }
        this._updater.transaction({
            fetcher: this._saver,
            setter: new CellxPullAtomSetter(push, fail)
        })
            .run()
    }

    reap(): void {
        this._updater.cancel()
    }

    pull: PullFn<V> = (
        push: (v: V) => void,
        fail: (e: Error) => void,
        oldValue: ?V
    ) => this._pull(push, fail, oldValue)
}
