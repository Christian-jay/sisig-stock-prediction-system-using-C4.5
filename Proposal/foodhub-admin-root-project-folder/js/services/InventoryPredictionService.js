/**
 * InventoryPredictionService - C4.5 Decision Tree logic for Predictive Stock Alerts
 * Encapsulates the risk assessment algorithm for inventory ingredients
 */

import { InventoryPredictionModel } from '../models/InventoryPredictionModel.js';

export class InventoryPredictionService {

    /**
     * Analyzes ingredients and returns risk assessments using C4.5-inspired rules
     * @param {InventoryPredictionModel.IngredientItem[]} ingredients
     * @returns {InventoryPredictionModel.PredictionSummary}
     */
    analyzeInventory(ingredients) {
        const escape = (value) => this.escapeHtml(value);

        const assessments = ingredients.map(item => {
            const quantity = Number(item.quantity) || 0;
            const reorderLevel = Number(item.reorder_level) || 0;
            const usage = String(item.daily_usage || item.dailyUsage || 'Low').toLowerCase();

            let risk;
            let reason;
            let action;
            let priority;

            // C4.5 Decision Rules (ordered by priority)
            if (quantity <= 0) {
                risk = InventoryPredictionModel.RISK_LEVELS.CRITICAL;
                reason = 'No stock available';
                action = 'Restock immediately';
                priority = InventoryPredictionModel.PRIORITY[InventoryPredictionModel.RISK_LEVELS.CRITICAL];
            } else if (quantity <= reorderLevel) {
                risk = InventoryPredictionModel.RISK_LEVELS.HIGH;
                reason = 'Stock has reached the reorder level';
                action = 'Prepare a replenishment request';
                priority = InventoryPredictionModel.PRIORITY[InventoryPredictionModel.RISK_LEVELS.HIGH];
            } else if (
                usage === 'high' &&
                quantity <= reorderLevel * 2
            ) {
                risk = InventoryPredictionModel.RISK_LEVELS.HIGH;
                reason = 'High daily usage with limited stock buffer';
                action = 'Review stock and prioritize replenishment';
                priority = InventoryPredictionModel.PRIORITY[InventoryPredictionModel.RISK_LEVELS.HIGH];
            } else if (
                usage === 'high' ||
                (
                    usage === 'medium' &&
                    quantity <= reorderLevel * 2
                )
            ) {
                risk = InventoryPredictionModel.RISK_LEVELS.MEDIUM;
                reason = 'Usage pattern warrants closer monitoring';
                action = 'Monitor stock and review usage';
                priority = InventoryPredictionModel.PRIORITY[InventoryPredictionModel.RISK_LEVELS.MEDIUM];
            } else {
                risk = InventoryPredictionModel.RISK_LEVELS.LOW;
                reason = 'Stock is above the reorder threshold';
                action = 'Continue routine monitoring';
                priority = InventoryPredictionModel.PRIORITY[InventoryPredictionModel.RISK_LEVELS.LOW];
            }

            return {
                ...item,
                risk,
                reason,
                action,
                priority
            };
        });

        // Sort by priority (most urgent first), then by name
        assessments.sort((a, b) =>
            b.priority - a.priority ||
            escape(a.name).localeCompare(escape(b.name))
        );

        const criticalCount = assessments.filter(item => item.quantity <= 0).length;
        const highRiskCount = assessments.filter(
            item => item.quantity > 0 && item.risk === InventoryPredictionModel.RISK_LEVELS.HIGH
        ).length;

        return {
            criticalCount,
            highRiskCount,
            totalMonitored: assessments.length,
            assessments
        };
    }

    /**
     * Determines alert banner state from assessment results
     * @param {number} criticalCount
     * @param {number} highRiskCount
     * @returns {{type: string, title: string, description: string}}
     */
    getAlertState(criticalCount, highRiskCount) {
        if (criticalCount > 0) {
            return {
                type: InventoryPredictionModel.ALERT_TYPES.CRITICAL,
                title: `${criticalCount} ingredient${criticalCount > 1 ? 's' : ''} are out of stock`,
                description: 'Staff should prioritize restocking these items. ' +
                    'Administrators should review replenishment needs.'
            };
        } else if (highRiskCount > 0) {
            return {
                type: InventoryPredictionModel.ALERT_TYPES.WARNING,
                title: `${highRiskCount} ingredient${highRiskCount > 1 ? 's' : ''} require attention`,
                description: 'Review the high-risk items and prepare replenishment ' +
                    'before shortages occur.'
            };
        } else {
            return {
                type: InventoryPredictionModel.ALERT_TYPES.NORMAL,
                title: 'No critical stock alerts',
                description: 'No ingredients are currently classified as critical ' +
                    'or high risk by these inventory rules.'
            };
        }
    }

    /**
     * Formats quantity with unit for display
     * @param {number} qty
     * @param {string} unit
     * @returns {string}
     */
    formatQuantity(qty, unit) {
        const num = Number(qty) || 0;
        const u = this.escapeHtml(unit || '');
        const decimals = num % 1 === 0 ? 0 : 2;
        return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })} ${u}`;
    }

    /**
     * Basic HTML escape
     * @param {string} value
     * @returns {string}
     */
    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }
}

export default InventoryPredictionService;