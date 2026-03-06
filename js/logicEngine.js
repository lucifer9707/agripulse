window.LogicEngine = {
    THRESHOLDS: {
        N: { deficiency: 20, action: 'Apply Urea Fertilizer' },
        P: { deficiency: 15, action: 'Apply DAP (Diammonium Phosphate)' },
        K: { deficiency: 150, action: 'Apply MOP (Muriate of Potash)' }
    },
    
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

        let score = 100;
        const deficiencies = [];
        const actions = [];

        // pH Penalty
        if (ph < spec.phMin || ph > spec.phMax) score -= 20;

        // Universal checks
        if (n < this.THRESHOLDS.N.deficiency) {
            deficiencies.push('Nitrogen');
            actions.push(this.THRESHOLDS.N.action);
            score -= 15;
        }
        if (p < this.THRESHOLDS.P.deficiency) {
            deficiencies.push('Phosphorus');
            actions.push(this.THRESHOLDS.P.action);
            score -= 15;
        }
        if (k < this.THRESHOLDS.K.deficiency) {
            deficiencies.push('Potassium');
            actions.push(this.THRESHOLDS.K.action);
            score -= 15;
        }

        // Critical crop penalty
        let keyBelow = false;
        if (spec.keyNutrient === 'N' && n < spec.highDemand) keyBelow = true;
        else if (spec.keyNutrient === 'P' && p < spec.highDemand) keyBelow = true;
        else if (spec.keyNutrient === 'K' && k < spec.highDemand) keyBelow = true;

        if (keyBelow) {
            score -= 10;
            const keyName = spec.keyNutrient === 'N' ? 'Nitrogen' : 
                          (spec.keyNutrient === 'P' ? 'Phosphorus' : 'Potassium');
            if (!deficiencies.includes(keyName)) {
                deficiencies.push(`${keyName} (critical)`);
            }
        }

        score = Math.max(0, Math.min(100, score));

        let overall = 'Optimal';
        if (deficiencies.length > 0) overall = 'Deficient';
        if (deficiencies.some(d => d.includes('critical'))) overall = 'Critical';

        const uniqueActions = [...new Set(actions)];
        const fertilizerPlan = uniqueActions.length ? 
            uniqueActions.join('; ') : 
            'No fertilizer needed based on thresholds.';

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