// @flow

import StatusAtomSetter from './StatusAtomSetter'
import UpdaterStatus from '../UpdaterStatus'
import type {Atom} from '../interfaces'

export type GetAtom<V> = (v: V) => Atom<V>

export type CreateStatusAtomSetter<V> = <V>(
        value: V,
        status: UpdaterStatus
) => StatusAtomSetter<V>

export default function createStatusAtomSetterFactory(
    getAtom: GetAtom<any>
): CreateStatusAtomSetter<*> {
    return function createStatusAtomSetter<V>(
        value: V,
        status: UpdaterStatus
    ): StatusAtomSetter<V> {
        return new StatusAtomSetter(
            getAtom(value),
            getAtom(status)
        )
    }
}
