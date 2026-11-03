export class GeneralSettings {
    constructor(storeName, language, themeMode) {
        this.storeName = storeName;
        this.language = language;
        this.themeMode = themeMode || 'light';
    }
}

export class BusinessInfoSettings {
    constructor(ownerName, address, operatingHours) {
        this.ownerName = ownerName;
        this.address = address;
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