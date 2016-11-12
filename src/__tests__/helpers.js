// @flow
import 'core-js/es7/observable'

import sinon from 'sinon'

import AtomUpdater from '../AtomUpdater'

export class FakeAtom<V> {
    get: () => V
    set: (v: V) => void
    v: V

    constructor(v: V) {
        this.v = v
        this.get = sinon.spy(() => this.v)
        this.set = sinon.spy((val: V) => {
            this.v = val
        })
    }
}

function createTransact(): (fn: () => void) => void {
    return sinon.spy((fn: () => void) => fn())
}

export function createUpdater(): {
    transact: (fn: () => void) => void,
    updater: AtomUpdater
} {
    const transact = createTransact()
    const updater = new AtomUpdater({transact, rollback: true})

    return {transact, updater}
}

// core-js observable fix:
export function fixTick(
    f: () => void
): () => Promise<any> {
    return () => {
        return new Promise((resolve: () => void, reject: (e: Error) => void) => {
            setTimeout(() => {
                try {
                    resolve(f())
                } catch (e) {
                    reject(e)
                }
            }, 0)
        })
    }
}
