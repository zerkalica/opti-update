// @flow
/* eslint-env mocha */

import sinon from 'sinon'
import assert from 'power-assert'
import {fixTick, FakeAtom, createUpdater} from './helpers'
import UpdaterStatus from '../UpdaterStatus'
import AtomUpdater from '../AtomUpdater'
import RecoverableError from '../queue/RecoverableError'
import StatusAtomSetter from '../adapters/StatusAtomSetter'

describe('fetcher', () => {
    const v1 = {a: 1}
    const v2 = {a: 2}
    const v3 = {a: 3}

    describe('on transaction success', () => {
        let updater: AtomUpdater
        let atom: FakeAtom<*>
        let status: FakeAtom<UpdaterStatus>
        let promise: Promise<*>
        let fetcher: Object

        beforeEach(() => {
            const u = createUpdater()
            updater = u.updater
            atom = new FakeAtom(v1)
            status = new FakeAtom(new UpdaterStatus('complete'))
            promise = Promise.resolve(v3)
            fetcher = {
                type: 'promise',
                fetch: sinon.spy(() => promise)
            }
            updater.transaction({
                fetcher,
                setter: new StatusAtomSetter(atom, status)
            })
                .set(atom, v2)
                .run()
        })

        it('status is pending after transaction.run', () => {
            assert(status.v.pending === true)
        })

        it('value of atom changed to v2 after transaction.run', () => {
            assert.deepEqual(atom.v, v2)
        })

        it('status is success after transaction success', () => {
            return promise.then(() => {
                assert(status.v.complete === true)
            })
        })

        it('value of atom changed to v3 after transaction success', () => {
            return promise.then(() => {
                assert.deepEqual(atom.v, v3)
            })
        })

        describe('another value, added to active queue', () => {
            const va1 = {b: 1}
            const va2 = {b: 2}
            let atom2: FakeAtom<Object>

            beforeEach(() => {
                atom2 = new FakeAtom(va1)
                updater.transaction()
                    .set(atom2, va2)
                    .run()
            })

            it('is updated value after transaction.run', () => {
                assert.deepEqual(atom2.v, va2)
            })

            it('is new after transaction complete', () => {
                return promise.then(() => {
                    assert.deepEqual(atom2.v, va2)
                })
            })
        })
    })


    describe('on transaction error', () => {
        let updater: AtomUpdater
        let atom: FakeAtom<*>
        let status: FakeAtom<UpdaterStatus>
        let promise: Promise<*>
        let fetcher: Object

        beforeEach(() => {
            const u = createUpdater()
            updater = u.updater
            atom = new FakeAtom(v1)
            status = new FakeAtom(new UpdaterStatus('complete'))
            promise = Promise.reject(new Error('test error'))
            fetcher = {
                type: 'promise',
                fetch: sinon.spy(() => promise)
            }
            updater.transaction({
                fetcher,
                setter: new StatusAtomSetter(atom, status)
            })
                .set(atom, v2)
                .run()
        })

        it('status.error is RecoverableError', () => {
            return promise.catch(fixTick(() => {
                assert(status.v.error instanceof RecoverableError)
            }))
        })

        it('value not rollbacked', () => {
            return promise.catch(fixTick(() => {
                assert(atom.v.a === 2)
            }))
        })

        describe('after RecoverableError.retry', () => {
            it('status changed to pending', () => {
                return promise.catch(fixTick(() => {
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.retry()
                    assert(status.v.pending === true)
                    assert(atom.v.a === 2)
                }))
            })

            it('value not rollbacked', () => {
                return promise.catch(fixTick(() => {
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.retry()
                    assert(atom.v.a === 2)
                }))
            })

            it('fetcher.fetch called again', () => {
                return promise.catch(fixTick(() => {
                    assert(fetcher.fetch.calledOnce)
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.retry()
                    assert(fetcher.fetch.calledTwice)
                }))
            })

            it('status.error changed to RecoverableError after second error', () => {
                return promise.catch(fixTick(() => {
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.retry()
                }))
                .then((() => {
                    assert(status.v.error instanceof RecoverableError)
                }))
            })
        })

        describe('after RecoverableError.abort', () => {
            it('value rollbacked', () => {
                return promise.catch(fixTick(() => {
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.abort()
                    assert(atom.v.a === 1)
                }))
            })

            it('status error changed to Error', () => {
                return promise.catch(fixTick(() => {
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.abort()
                    assert(!(status.v.error instanceof RecoverableError))
                }))
            })
        })

        describe('another value, added to active queue', () => {
            const va1 = {b: 1}
            const va2 = {b: 2}
            let atom2: FakeAtom<Object>

            beforeEach(() => {
                atom2 = new FakeAtom(va1)
                updater.transaction()
                    .set(atom2, va2)
                    .run()
            })

            it('is updated value after transaction.run', () => {
                assert.deepEqual(atom2.v, va2)
            })

            it('is updated value after transaction error', () => {
                return promise.catch(() => {
                    assert.deepEqual(atom2.v, va2)
                })
            })

            it('is old value after RecoverableError.abort', () => {
                return promise.catch(() => {
                    if (!(status.v.error instanceof RecoverableError)) {
                        throw new Error()
                    }
                    status.v.error.abort()
                    assert.deepEqual(atom2.v, va1)
                })
            })
        })
    })
})
