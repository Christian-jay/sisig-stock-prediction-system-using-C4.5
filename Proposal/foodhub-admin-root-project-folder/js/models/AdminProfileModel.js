/* =========================================================
   ADMIN PROFILE MODEL
   ========================================================= */

export class AdminProfileModel {

    constructor(data = {}) {

        this.fullName =
            data.fullName || 'Juan Dela Cruz';

        this.role =
            data.role || 'Administrator';

        this.email =
            data.email || 'juan.delacruz@foodhub.com';

    }

}


/* =========================================================
   ADMIN PROFILE DATA MODEL
   ========================================================= */

export class AdminProfileDataModel {

    constructor(data = {}) {

        this.profile =
            new AdminProfileModel(data.profile || {});

    }

}