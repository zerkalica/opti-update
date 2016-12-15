// @flow

export interface ISyncUpdate<V> {
    rollback(): void;
    set(): void;
}

export interface IAsyncUpdate<V> {
    setSubscription(subscription: Subscription): void;
    isSubscribed(): boolean;
    unsubscribe(): void;

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
    abort(err: Error): void;
}
