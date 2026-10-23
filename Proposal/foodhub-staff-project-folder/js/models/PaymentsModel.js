/* =========================================================
   PAYMENT MODEL
   ========================================================= */

export class PaymentModel {
    constructor(data = {}) {
        this.id = data.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
        this.date = data.date || new Date().toLocaleString();
        this.customer = data.customer || 'Walk-in Customer';
        this.method = data.method || 'Cash'; // Cash, GCash, Maya, Panda
        this.amount = data.amount !== undefined ? Number(data.amount) : 0;
        this.status = data.status || 'Paid';

        if (Number.isNaN(this.amount)) {
            this.amount = 0;
        }
    }
}