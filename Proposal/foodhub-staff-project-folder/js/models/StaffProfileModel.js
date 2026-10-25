export class UserProfileModel {
    constructor(data = {}) {
        this.id = data.id || 'STF-102';
        this.fullName = data.fullName || 'Juan Dela Cruz';
        this.role = data.role || 'Staff Member';
        this.email = data.email || 'juan.delacruz@foodhub.com';
    }
}

export class StaffProfileModel {
    constructor(data = {}) {
        this.profile = new UserProfileModel(data.profile || {});
    }
}