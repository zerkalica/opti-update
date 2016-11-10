// @flow

import type {UpdaterStatus, Atom, Transact} from './interfaces'
import UpdaterStatusImpl from './UpdaterStatus'

export default class StatusSetter {
    _atoms: Atom<UpdaterStatus>[] = []
    _transact: Transact

    constructor(transact: Transact) {
        this._transact = transact
    }

    addListener(atom: Atom<UpdaterStatus>): void {
        this._atoms.push(atom)
    }

    removeListeners(): void {
        this._atoms = []
    }

    _setAborted = () => {
        const a = this._atoms
        const status = new UpdaterStatusImpl('aborted')
        for (let i = 0; i < a.length; i++) {
            a[i].set(status)
        }
    }
    setAborted = () => this._transact(this._setAborted)

    _setPending = () => {
        const a = this._atoms
        const status = new UpdaterStatusImpl('pending')
        for (let i = 0; i < a.length; i++) {
            a[i].set(status)
        }
    }
    setPending = () => this._transact(this._setPending)

    _setComplete = () => {
        const a = this._atoms
        const status = new UpdaterStatusImpl('complete')
        for (let i = 0; i < a.length; i++) {
            a[i].set(status)
        }
    }
    setComplete = () => this._transact(this._setComplete)

    _setError(error: Error): void {
        const a = this._atoms
        const status = new UpdaterStatusImpl('error', error)
        for (let i = 0; i < a.length; i++) {
            a[i].set(status)
        }
    }
    setError = (error: Error) => this._transact(() => this._setError(error))
}
