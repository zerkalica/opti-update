// @flow
/* eslint-env mocha */

import sinon from 'sinon'
import assert from 'power-assert'
import {FakeAtom, createUpdater} from './helpers'

describe('syncs', () => {
    it('should update single atom', () => {
        const {transact, updater} = createUpdater()
        const atom1 = new FakeAtom({a: 1})

        updater.transaction()
            .set(atom1, {a: 2})
            .run()

        assert(atom1.set.calledOnce)
        assert(atom1.set.firstCall.calledWith(
            sinon.match({a: 2})
        ))
        assert(transact.notCalled)
    })

    it('should update atoms transactinally', () => {
        const {transact, updater} = createUpdater()
        const atom1 = new FakeAtom({a: 1})
        const atom2 = new FakeAtom({b: 1})

        updater.transaction()
            .set(atom1, {a: 2})
            .set(atom2, {b: 2})
            .run()

        assert(atom2.set.calledOnce)
        assert(atom2.set.firstCall.calledWith(
            sinon.match({b: 2})
        ))
        assert(transact.calledOnce)
    })
})
