// js/aiExplanation.js
const AiExplanation = {
    // generates farmer-friendly summary using crop and deficiencies (LLM simulation)
    generate(soil, targetCrop, logicResult) {
        if (!logicResult) return 'Upload data and select crop to generate insight.';
        const crop = targetCrop.toLowerCase();
        const deficiencies = logicResult.health_metrics.critical_deficiencies;
        const score = logicResult.recommendation.suitability_score;
        const keyMap = { N: 'nitrogen', P: 'phosphorus', K: 'potassium' };
        const spec = LogicEngine.CROP_SPECS[targetCrop];
        const keyName = keyMap[spec.keyNutrient];

        // base explanation parts
        let explanation = `For your ${targetCrop} crop, `;

        if (deficiencies.length === 0) {
            explanation += `the soil nutrient levels are well balanced. pH is within ideal range (${spec.phMin}-${spec.phMax}) and key nutrient ${keyName} is sufficient. Continue regular monitoring.`;
        } else {
            explanation += `the analysis shows ${deficiencies.join(', ')} deficiency. `;
            if (deficiencies.includes('Nitrogen') || deficiencies.includes('Nitrogen (critical crop)')) {
                explanation += 'Nitrogen helps leaves grow green and strong – think of it as the “leaf fuel”. Urea provides a quick boost. ';
            }
            if (deficiencies.includes('Phosphorus') || deficiencies.includes('Phosphorus (critical crop)')) {
                explanation += 'Phosphorus is vital for root development and flowers; DAP gives roots a strong start. ';
            }
            if (deficiencies.includes('Potassium') || deficiencies.includes('Potassium (critical crop)')) {
                explanation += 'Potassium protects against disease and helps fruit quality; MOP strengthens stems and fruits. ';
            }
            if (deficiencies.some(d => d.includes('critical'))) {
                explanation += `This is critical because ${targetCrop} has high demand for ${keyName}. Without it, yields may drop sharply. `;
            }
            explanation += `Apply recommended fertilizers and retest after 2 weeks.`;
        }

        // add pH note if out of range
        if (soil.ph_level < spec.phMin || soil.ph_level > spec.phMax) {
            explanation += ` Note: pH is outside ${spec.phMin}-${spec.phMax} range; consider liming or sulfur to adjust.`;
        }

        return explanation;
    }
};
window.AiExplanation = AiExplanation;