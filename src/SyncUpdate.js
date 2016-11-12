// @flow

import type {ISyncUpdate} from './queue'
import type {Atom} from './interfaces'

export default class SyncUpdate<V> {
    _atom: Atom<V>
    _oldValue: V
    _nextValue: V

    constructor(atom: Atom<V>, nextValue: V) {
        this._atom = atom
        this._oldValue = atom.get()
        this._nextValue = nextValue
    }

    rollback(): void {
        this._atom.set(this._oldValue)
    }

    set(): void {
        this._atom.set(this._nextValue)
    }
}

if (0) ((new SyncUpdate(...(0: any))): ISyncUpdate<*>) // eslint-disable-line
