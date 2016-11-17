// @flow

import GenericAtomSetter from './GenericAtomSetter'
import UpdaterStatus from '../UpdaterStatus'
import type {Atom} from '../interfaces'

export type GetAtom<V> = (v: V) => Atom<V>

export type CreateGenericAtomSetter<V> = <V>(
        value: V,
        status: UpdaterStatus
) => GenericAtomSetter<V>

export default function createGenericAtomSetterFactory(
    getAtom: GetAtom<any>
): CreateGenericAtomSetter<*> {
    return function createGenericAtomSetter<V>(
        value: V,
        status: UpdaterStatus
    ): GenericAtomSetter<V> {
        return new GenericAtomSetter(
            getAtom(value),
            getAtom(status)
        )
    }
}
