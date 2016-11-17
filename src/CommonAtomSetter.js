// @flow

import UpdaterStatus from './UpdaterStatus'
import type {Atom} from './interfaces'

export default class CommonAtomSetter<V> {
    _atom: Atom<V>
    _status: Atom<UpdaterStatus>

    constructor(
        atom: Atom<V>,
        status: Atom<UpdaterStatus>
    ) {
        this._atom = atom
        this._status = status
    }

    pending(): void {
        const s = this._status
        s.set(s.get().copy('pending'))
    }

    complete(): void {
        const s = this._status
        s.set(s.get().copy('complete'))
    }

    next(v: V): void {
        this._atom.set(v)
    }

    error(err: Error): void {
        const s = this._status
        s.set(s.get().copy('error', err))
    }
}
