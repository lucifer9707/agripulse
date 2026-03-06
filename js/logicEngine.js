// js/logicEngine.js
const LogicEngine = {
    // universal thresholds
    THRESHOLDS: {
        N: { deficiency: 20, action: 'Apply Urea Fertilizer' },
        P: { deficiency: 15, action: 'Apply DAP (Diammonium Phosphate)' },
        K: { deficiency: 150, action: 'Apply MOP (Muriate of Potash)' }
    },
    // crop specific
    CROP_SPECS: {
        TOMATO: { phMin: 6.0, phMax: 7.0, keyNutrient: 'K', highDemand: 200 },
        WHEAT:  { phMin: 6.0, phMax: 7.5, keyNutrient: 'N', highDemand: 30 },
        RICE:   { phMin: 5.0, phMax: 6.5, keyNutrient: 'P', highDemand: 25 },
        MAIZE:  { phMin: 5.8, phMax: 7.0, keyNutrient: 'N', highDemand: 35 }
    },

    evaluate(soil, targetCrop) {
        if (!soil || !targetCrop || !this.CROP_SPECS[targetCrop]) {
            return null;
        }
        const spec = this.CROP_SPECS[targetCrop];
        const n = soil.nitrogen, p = soil.phosphorus, k = soil.potassium, ph = soil.ph_level;

        // 1. base score
        let score = 100;

        // 2. pH penalty
        if (ph < spec.phMin || ph > spec.phMax) score -= 20;

        // deficiencies tracking
        const deficiencies = [];
        let fertilizerActions = [];

        // universal checks
        if (n < this.THRESHOLDS.N.deficiency) {
            deficiencies.push('Nitrogen');
            fertilizerActions.push(this.THRESHOLDS.N.action);
            score -= 15;
        }
        if (p < this.THRESHOLDS.P.deficiency) {
            deficiencies.push('Phosphorus');
            fertilizerActions.push(this.THRESHOLDS.P.action);
            score -= 15;
        }
        if (k < this.THRESHOLDS.K.deficiency) {
            deficiencies.push('Potassium');
            fertilizerActions.push(this.THRESHOLDS.K.action);
            score -= 15;
        }

        // 3. critical crop penalty (key nutrient below high demand)
        let keyBelow = false;
        if (spec.keyNutrient === 'N' && n < spec.highDemand) keyBelow = true;
        else if (spec.keyNutrient === 'P' && p < spec.highDemand) keyBelow = true;
        else if (spec.keyNutrient === 'K' && k < spec.highDemand) keyBelow = true;

        if (keyBelow) {
            score -= 10;
            // also add specific key nutrient deficiency if not already present
            const keyName = spec.keyNutrient === 'N' ? 'Nitrogen' : (spec.keyNutrient === 'P' ? 'Phosphorus' : 'Potassium');
            if (!deficiencies.includes(keyName)) {
                deficiencies.push(`${keyName} (critical crop)`);
            }
            // ensure fertilizer for that key nutrient is included (if not already)
            const keyAction = this.THRESHOLDS[spec.keyNutrient].action;
            if (!fertilizerActions.includes(keyAction)) {
                fertilizerActions.push(keyAction);
            }
        }

        // ensure score between 0-100
        score = Math.max(0, Math.min(100, score));

        // overall health
        let overall = 'Optimal';
        if (deficiencies.length > 0) overall = 'Deficient';
        if (deficiencies.some(d => d.includes('critical') || (keyBelow && deficiencies.length > 1))) overall = 'Critical';

        // deduplicate fertilizer plan
        const uniqueActions = [...new Set(fertilizerActions)];
        const fertilizerPlan = uniqueActions.length ? uniqueActions.join('; ') : 'No fertilizer needed based on thresholds.';

        return {
            health_metrics: {
                overall_health: overall,
                critical_deficiencies: deficiencies
            },
            recommendation: {
                fertilizer_plan: fertilizerPlan,
                suitability_score: score
            }
        };
    }
};

window.LogicEngine = LogicEngine;