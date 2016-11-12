// @flow

export type UpdaterStatusType = 'error' | 'pending' | 'complete'

export default class UpdaterStatus {
    complete: boolean
    pending: boolean
    error: ?Error

    constructor(
        type?: UpdaterStatusType,
        error?: ?Error
    ) {
        this.complete = type === 'complete'
        this.pending = !type || type === 'pending'
        this.error = error || null
    }

    static merge(statuses: UpdaterStatus[]): UpdaterStatus {
        const newStatus = new UpdaterStatus('complete')
        for (let i = 0, l = statuses.length; i < l; i++) {
            const status = statuses[i]
            if (status.pending) {
                newStatus.pending = true
                newStatus.complete = false
            }
            if (status.error) {
                newStatus.error = status.error
                newStatus.complete = false
                newStatus.pending = false
                break
            }
        }

        return newStatus
    }
}
