/**
 * InventoryPredictionModel - Data models for C4.5 Predictive Stock Alert
 * Defines the structure for risk assessments and predictions
 */

export class InventoryPredictionModel {
    /**
     * @typedef {Object} IngredientItem
     * @property {string|number} id
     * @property {string} name
     * @property {string} category
     * @property {number} quantity
     * @property {string} unit
     * @property {number} reorder_level
     * @property {string} daily_usage
     * @property {string} [category_display]
     * @property {string} [unit_display]
     * @property {string} [daily_usage_display]
     */

    /**
     * @typedef {Object} RiskAssessment
     * @property {string} risk - 'Critical' | 'High' | 'Medium' | 'Low'
     * @property {string} reason
     * @property {string} action
     * @property {number} priority - 1 (low) to 4 (critical)
     * @property {IngredientItem} item - Original ingredient data
     */

    /**
     * @typedef {Object} PredictionSummary
     * @property {number} criticalCount
     * @property {number} highRiskCount
     * @property {number} totalMonitored
     * @property {RiskAssessment[]} assessments
     */

    /**
     * Risk level constants
     */
    static RISK_LEVELS = {
        CRITICAL: 'Critical',
        HIGH: 'High',
        MEDIUM: 'Medium',
        LOW: 'Low'
    };

    static PRIORITY = {
        [InventoryPredictionModel.RISK_LEVELS.CRITICAL]: 4,
        [InventoryPredictionModel.RISK_LEVELS.HIGH]: 3,
        [InventoryPredictionModel.RISK_LEVELS.MEDIUM]: 2,
        [InventoryPredictionModel.RISK_LEVELS.LOW]: 1
    };

    /**
     * CSS class mapping for risk badges
     */
    static RISK_CLASSES = {
        [InventoryPredictionModel.RISK_LEVELS.CRITICAL]: 'critical',
        [InventoryPredictionModel.RISK_LEVELS.HIGH]: 'high',
        [InventoryPredictionModel.RISK_LEVELS.MEDIUM]: 'medium',
        [InventoryPredictionModel.RISK_LEVELS.LOW]: 'low'
    };

    /**
     * Alert banner types
     */
    static ALERT_TYPES = {
        CRITICAL: 'is-critical',
        WARNING: 'is-warning',
        NORMAL: ''
    };
}

export default InventoryPredictionModel;