export class GeneralSettings {
    constructor(storeName, language) {
        this.storeName = storeName;
        this.language = language;
    }
}

export class BusinessInfoSettings {
    constructor(ownerName, address, tinNumber, operatingHours) {
        this.ownerName = ownerName;
        this.address = address;
        this.tinNumber = tinNumber;
        this.operatingHours = operatingHours;
    }
}

export class NotificationSettings {
    constructor(emailAlerts, orderSoundAlerts, smsNotifications) {
        this.emailAlerts = emailAlerts;
        this.orderSoundAlerts = orderSoundAlerts;
        this.smsNotifications = smsNotifications;
    }
}

export class PaymentSettings {
    constructor(payAtStore, paymentNote) {
        this.payAtStore = payAtStore;
        this.paymentNote = paymentNote;
    }
}

export class BackupSettings {
    constructor(autoBackup, lastBackupDate) {
        this.autoBackup = autoBackup;
        this.lastBackupDate = lastBackupDate;
    }
}