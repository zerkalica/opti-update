// @flow
export type UpdaterStatusType = 'error' | 'pending' | 'complete' | 'aborted'

export default class UpdaterStatus {
    complete: boolean
    pending: boolean
    aborted: boolean
    error: ?Error

    static isComplete: boolean = false

    constructor(
        type?: UpdaterStatusType,
        error?: ?Error
    ) {
        let t: ?UpdaterStatusType = type
        if (!t && this.constructor.isComplete) {
            t = 'complete'
        }
        this.aborted = t === 'aborted'
        this.complete = t === 'complete'
        this.pending = !t || t === 'pending'
        this.error = error || null
    }
}
