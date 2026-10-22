export class OrderModel {
    constructor(data) {
        this.id = data.id;
        this.orderId = data.orderId;
        this.totalOrders = data.totalOrders;
        this.status = data.status; // 'completed', 'processing', 'pending', 'cancelled'
        this.date = data.date;
    }

    getStatusBadgeClass() {
        return this.status.toLowerCase();
    }
}