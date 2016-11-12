// @flow

import type UpdaterStatus from './UpdaterStatus'

export type Transact = (fn: () => void) => void

export interface Atom<V> {
    set(val: V): void;
    get(): V;
}

interface ObservableLoader<V> {
    type: 'observable';
    atom: Atom<V>;
    status: Atom<UpdaterStatus>;
    fetch(): Observable<V, Error>;
}

interface PromiseLoader<V> {
    type: 'promise';
    atom: Atom<V>;
    status: Atom<UpdaterStatus>;
    fetch(): Promise<V>;
}

export type Loader<V> = ObservableLoader<V> | PromiseLoader<V>
