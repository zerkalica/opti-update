// @flow

import AtomUpdater from './AtomUpdater'
import Transaction from './Transaction'
import CommonAtomSetter from './CommonAtomSetter'
import UpdaterStatus from './UpdaterStatus'
import type {Atom, Fetcher} from './interfaces'

export type GetAtom<V> = (v: V) => Atom<V>

export type UpdaterFacade<V> = {
    value: V;
    status: UpdaterStatus;
    fetcher: Fetcher<V>;
}

export default class ValueUpdater {
    _atomUpdater: AtomUpdater
    _getAtom: GetAtom<any>

    constructor(atomUpdater: AtomUpdater, getAtom: GetAtom<*>) {
        this._getAtom = getAtom
        this._atomUpdater = atomUpdater
    }

    cancel(): ValueUpdater {
        this._atomUpdater.cancel()
        return this
    }

    transaction<F>(updater: UpdaterFacade<F>): Transaction<F> {
        return this._atomUpdater.transaction({
            fetcher: updater.fetcher,
            setter: new CommonAtomSetter(
                this._getAtom(updater.value),
                this._getAtom(updater.status)
            )
        })
    }
}
