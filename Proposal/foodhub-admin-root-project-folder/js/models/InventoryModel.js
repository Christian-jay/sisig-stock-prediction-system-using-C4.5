export class InventoryItem {
    constructor(
        id,
        name,
        quantity,
        unit,
        reorderPoint = 5,
        demandRate = "High"
    ) {
        if (id == null) {
            throw new TypeError("Inventory ID is required.");
        }

        if (typeof name !== "string" || !name.trim()) {
            throw new TypeError("Inventory name is required.");
        }

        if (typeof unit !== "string" || !unit.trim()) {
            throw new TypeError("Inventory unit is required.");
        }

        this.id = id;
        this.name = name.trim();
        this.unit = unit.trim();
        this.quantity = this.validateNonNegativeNumber(
            quantity,
            "quantity"
        );
        this.reorderPoint = this.validateNonNegativeNumber(
            reorderPoint,
            "reorderPoint"
        );

        const validDemandRates = ["High", "Medium", "Low"];

        if (!validDemandRates.includes(demandRate)) {
            throw new RangeError(
                "Demand rate must be High, Medium, or Low."
            );
        }

        this.demandRate = demandRate;
        this.status = this.determineStatus();
    }

    validateNonNegativeNumber(value, fieldName) {
        const number = Number(value);

        if (!Number.isFinite(number) || number < 0) {
            throw new RangeError(
                `${fieldName} must be a non-negative number.`
            );
        }

        return number;
    }

    determineStatus() {
        if (this.quantity === 0) {
            return "Out of Stock";
        }

        if (this.quantity <= this.reorderPoint) {
            return "Low Stock";
        }

        return "In Stock";
    }

    isCritical() {
        return this.quantity === 0;
    }
}
