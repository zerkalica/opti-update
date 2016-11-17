// @flow

import type {Atom} from '../interfaces'

export default class GenericAtomSetter<V> {
    _atom: Atom<V>
    _pending: Atom<boolean>
    _error: Atom<?Error>

    constructor(
        atom: Atom<V>,
        pending: Atom<boolean>,
        error: Atom<?Error>
    ) {
        this._atom = atom
        this._pending = pending
        this._error = error
    }

    pending(): void {
        this._pending.set(true)
    }

    complete(): void {
        this._pending.set(false)
    }

    next(v: V): void {
        this._atom.set(v)
    }

    error(err: Error): void {
        this._error.set(err)
    }
}
