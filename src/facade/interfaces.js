// @flow

import type {Atom} from '../interfaces'
import type UpdaterStatus from '../UpdaterStatus'

export type GetAtom<V> = (v: V) => Atom<V>

interface ObservableLoaderFacade<V> {
    type: 'observable';
    value: V;
    status: UpdaterStatus;
    fetch(): Observable<V, Error>;
}

interface PromiseLoaderFacade<V> {
    type: 'promise';
    value: V;
    status: UpdaterStatus;
    fetch(): Promise<V>;
}

export type LoaderFacade<V> = ObservableLoaderFacade<V> | PromiseLoaderFacade<V>
