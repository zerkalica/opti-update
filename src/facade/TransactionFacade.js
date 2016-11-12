// @flow

import Transaction from '../Transaction'
import type {LoaderFacade, GetAtom} from './interfaces'
import AtomLoaderAdapter from './AtomLoaderAdapter'

export default class TransactionFacade {
    _getAtom: GetAtom<any>
    _transaction: Transaction

    constructor(getAtom: GetAtom<*>, transaction: Transaction) {
        this._getAtom = getAtom
        this._transaction = transaction
    }

    set<V>(v: V): TransactionFacade {
        this._transaction.set(this._getAtom(v), v)
        return this
    }

    run<V>(loader?: ?LoaderFacade<V>): void {
        this._transaction.run(loader
            ? new AtomLoaderAdapter(loader, this._getAtom)
            : null
        )
    }
}
