// @flow
import UpdaterObserver from './UpdaterObserver'
import type {UpdaterOpts} from './interfaces'
import Transaction from './Transaction'

/**
 * @example
 *
 * @source({key: 'MyStatus'})
 * class MyStatus extends UpdaterStatus {}
 *
 * updater.transact(myStatus)
 * .set(user)
 * .setPromise(somePromise)
 * .run()
 */
export default class Updater {
    _uo: UpdaterObserver

    constructor(opts: UpdaterOpts) {
        this._uo = new UpdaterObserver(opts)
    }

    cancel(): Updater {
        this._uo.cancel()
        return this
    }

    transact(): Transaction {
        return new Transaction(this._uo)
    }
}
