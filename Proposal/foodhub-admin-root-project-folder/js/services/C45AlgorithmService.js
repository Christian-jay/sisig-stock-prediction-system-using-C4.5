export class C45AlgorithmService {
    static calculateEntropy(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return 0;
        }

        const classCounts = new Map();

        for (const item of items) {
            const label = item.status ?? item.determineStatus?.();

            if (label == null) continue;

            classCounts.set(
                label,
                (classCounts.get(label) || 0) + 1
            );
        }

        const total = [...classCounts.values()]
            .reduce((sum, count) => sum + count, 0);

        if (total === 0) return 0;

        let entropy = 0;

        for (const count of classCounts.values()) {
            const probability = count / total;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    static classifyInventory(items) {
        if (!Array.isArray(items)) {
            throw new TypeError("Inventory items must be an array.");
        }

        return items.map(item => {
            if (!item || typeof item !== "object") {
                throw new TypeError("Each inventory item must be an object.");
            }

            const quantity = Number(item.quantity);
            const reorderPoint = Number(item.reorderPoint);

            if (
                !Number.isFinite(quantity) ||
                quantity < 0 ||
                !Number.isFinite(reorderPoint) ||
                reorderPoint < 0
            ) {
                throw new RangeError(
                    `Invalid quantity or reorder point for "${item.name ?? "unknown item"}".`
                );
            }

            let predictedClass;

            if (quantity === 0) {
                predictedClass = "Out of Stock";
            } else if (quantity <= reorderPoint) {
                predictedClass = "Low Stock";
            } else {
                predictedClass = "In Stock";
            }

            return {
                ...item,
                c45Classification: predictedClass,

                // This rule-based classifier does not calculate
                // a C4.5 gain ratio.
                gainRatio: null
            };
        });
    }
}
