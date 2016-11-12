// @flow

export interface ISyncUpdate<V> {
    set(): void;
    rollback(): void;
}

export interface IAsyncUpdate<V> {
    getObservable(): Observable<V, Error>;
    set(v: V): void;
    error(e: Error): void;
    pend(update: ISyncUpdate<*>): void;
    commit(v?: ?V): void;
    abort(e: Error): void;
}

export interface IInternalQueue {
    next(): void;
    retry(): void;
    getLastUpdate(): ?IAsyncUpdate<*>;
    cancel(): void;
    removeSubscription(subscription: Subscription): void;
}
