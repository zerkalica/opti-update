// @flow

export interface UpdaterStatus {
    complete: boolean;
    pending: boolean;
    error: ?Error;
}

export type Transact = (fn: () => void) => void

export interface Atom<V> {
    set(val: V): void;
    get(): V;
}

export type GetAtom<V> = (v: V) => Atom<V>

export type SyncUpdate<V> = V
export type AsyncUpdate<V> = () => Observable<V, Error>

export interface UpdaterOpts {
    getAtom: GetAtom<*>,
    transact: Transact,
    abortOnError?: boolean,
    rollbackOnAbort?: boolean
}
