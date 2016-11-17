// @flow

import AtomUpdater from '../AtomUpdater'
import type {Fetcher} from '../interfaces'
import Transaction from '../Transaction'

type PullFn<V> = (push: (v: V) => void, fail: (e: Error) => void, oldValue: ?V) => V

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
    defaultValue: V;
    loader?: ?Fetcher<V>;
    saver?: ?Fetcher<V>;
}

export default class CellxController<V> {
    _updater: AtomUpdater
    _loader: ?Fetcher<V>
    _saver: ?Fetcher<V>
    _defaultValue: V
    _transaction: ?Transaction<V>

    constructor(
        updater: AtomUpdater,
        opts: CellxUpdaterOpts<V>
    ) {
        this._updater = updater
        this._loader = opts.loader
        this._saver = opts.saver
        this._defaultValue = opts.defaultValue
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

    put(value: V, push: (v: V) => void, fail: (e: Error) => void): void {
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

    pull: PullFn<V> = (
        push: (v: V) => void,
        fail: (e: Error) => void,
        oldValue: ?V
    ) => this._pull(push, fail, oldValue)
}

/*
interface ICellOptions<T> {
    get?: (value: any) => T;
    put?: (value: any, push: (value: any) => void, fail: (err: any) => void, oldValue: any) => void;
    reap?: () => void;
}

interface Cell<V> {
    (v: V | PullFn<V>, opts: ICellOptions<V>): Cell<V>;
    get(): V;
    set(v: V): void;
}

export class CellFactory {
    _updater: AtomUpdater
    _CellClass: Class<Cell<any>>

    constructor(
        updater: AtomUpdater,
        CellClass: Class<Cell<any>>
    ) {
        this._updater = updater
        this._CellClass = CellClass
    }

    create<V>(opts: CellxUpdaterOpts<V>): Cell<V> {
        const upd: CellxUpdater<V> = new CellxUpdater(this._updater, opts)
        return new this._CellClass(upd.pull, upd)
    }
}
*/
