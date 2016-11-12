// @flow

import type {LoaderFacade, GetAtom} from './interfaces'
import type {Atom} from '../interfaces'
import UpdaterStatus from '../UpdaterStatus'

export default class AtomLoaderAdapter<V> {
    type: any
    atom: Atom<V>
    status: Atom<UpdaterStatus>
    _facade: LoaderFacade<V>

    constructor(loaderFacade: LoaderFacade<V>, getAtom: GetAtom<any>) {
        this.type = loaderFacade.type
        this.atom = getAtom(loaderFacade.value)
        this.status = getAtom(loaderFacade.status)
        this._facade = loaderFacade
    }

    fetch(): any {
        return this._facade.fetch()
    }
}
