// @flow

export type UpdaterStatusType = 'error' | 'pending' | 'complete'

export default class UpdaterStatus {
    complete: boolean
    pending: boolean
    error: ?Error
    type: UpdaterStatusType

    constructor(
        type?: UpdaterStatusType,
        error?: ?Error
    ) {
        this.type = type || 'pending'
        this.complete = type === 'complete'
        this.pending = this.type === 'pending'
        this.error = error || null
    }

    copy(
        type?: UpdaterStatusType,
        error?: ?Error
    ): UpdaterStatus {
        if (type === this.type && error === this.error) {
            return this
        }
        return new UpdaterStatus(type, error)
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
