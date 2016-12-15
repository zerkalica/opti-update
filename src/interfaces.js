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

export interface Canceller {
    cancel(): void;
}

export interface Queue {
    addSync<V>(a: Atom<V>, v: V): void;
    addAsync<V>(fetcher: Fetcher<V>, ctl: AtomSetter<V>): Canceller;
}
