// @flow

import AtomUpdater from '../AtomUpdater'
import type {GetAtom} from './interfaces'
import TransactionFacade from './TransactionFacade'

export default class UpdaterFacade {
    _updater: AtomUpdater
    _getAtom: GetAtom<any>

    constructor(updater: AtomUpdater, getAtom: GetAtom<*>) {
        this._getAtom = getAtom
        this._updater = updater
    }

    cancel(): UpdaterFacade {
        this._updater.cancel()
        return this
    }

    transaction(): TransactionFacade {
        return new TransactionFacade(this._getAtom, this._updater.transaction())
    }
}
