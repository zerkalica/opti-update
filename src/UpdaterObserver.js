// @flow

import AsyncQueue from './AsyncQueue'
import type {GetAtom, Transact, AsyncUpdate, SyncUpdate, UpdaterStatus, UpdaterOpts} from './interfaces'
import StatusSetter from './StatusSetter'
import RecoverableError from './RecoverableError'

export default class UpdaterObserver {
    displayName: string
    _transact: Transact
    _Queue: AsyncQueue
    _status: StatusSetter
    _pendingUpdates: SyncUpdate<*>[] = []

    _transact: Transact
    _getAtom: GetAtom<*>
    _abortOnError: boolean
    _rollbackOnAbort: boolean

    constructor(opts: UpdaterOpts) {
        this._abortOnError = opts.abortOnError || false
        this._rollbackOnAbort = opts.rollbackOnAbort || false
        this._getAtom = opts.getAtom
        this._transact = opts.transact
        this._status = new StatusSetter(opts.transact)
        const maxSize = opts.abortOnError ? 1 : 10
        this._Queue = new AsyncQueue((this: Observer<SyncUpdate<*>, Error>), maxSize)
    }

    cancel(): void {
        this._pendingUpdates = []
        this._Queue.cancel()
        this._status.removeListeners()
    }

    _rollback = () => {
        this._updateSync(this._pendingUpdates, false)
    }

    _abort = () => {
        this._Queue.cancel()
        this._status.setAborted()
        if (this._rollbackOnAbort) {
            this._transact(this._rollback)
        }
    }

    _retry = () => {
        this._status.setPending()
        this._Queue.continue()
    }

    error(error: Error) {
        if (this._abortOnError) {
            this._status.setError(error)
            this._abort()
        } else {
            this._status.setError(new RecoverableError(error, this._abort, this._retry))
        }
    }

    addAsyncs(asyncs: AsyncUpdate<*>[], syncs: SyncUpdate<*>[], status: ?UpdaterStatus): void {
        if (asyncs.length) {
            if (status) {
                this._status.addListener(this._getAtom(status))
            }
            this._status.setPending()
            this._Queue.add(asyncs).run()
        }
        this.next(syncs)
    }

    next(syncs: SyncUpdate<*>[]): void {
        if (syncs.length) {
            const transaction = () => this._updateSync(syncs, this._Queue.size > 0)
            this._transact(transaction)
        }
    }

    complete(updates?: SyncUpdate<*>[]): void {
        if (updates) {
            this.next(updates)
        } else if (this._Queue.size === 0) {
            this._status.setComplete()
            this._status.removeListeners()
            this._pendingUpdates = []
        }
    }

    _updateSync(updates: SyncUpdate<*>[], isPending: boolean): void {
        const pd = this._pendingUpdates
        const getAtom = this._getAtom
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i]
            const atom = getAtom(update)
            if (isPending) {
                pd.push(atom.get())
            }
            atom.set(update)
        }
        if (!isPending) {
            this._status.removeListeners()
            this._pendingUpdates = []
        }
    }
}
