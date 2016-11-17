// @flow

export type Transact = (fn: () => void) => void

export interface Atom<V> {
    get: () => V;
    set: (val: V) => void;
}

export interface AtomSetter<V> {
    pending(): void;

    complete(): void;
    next(v: V): void;
    error(err: Error): void;
}

export type Fetcher<V> = {
    type: 'promise';
    fetch: () => Promise<V>;
} | {
    type: 'observable';
    fetch: () => Observable<V, Error>;
}

export type Updater<V> = {
    setter: AtomSetter<V>;
    fetcher: Fetcher<V>;
}
