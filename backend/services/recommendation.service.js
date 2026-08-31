const db = require('../config/database');

/**
 * Rule-based crop decision support (NOT a replacement for agronomist advice).
 * Matches a soil report against the crop reference database using
 * pH range and soil type overlap, and returns ranked suggestions.
 */
function recommendCrops(soilReport, season = null) {
    const crops = db.prepare('SELECT * FROM crops').all();
    const ph = soilReport.ph;

    const scored = crops.map(crop => {
        let score = 0;
        const reasons = [];

        if (ph != null && crop.ph_min != null && crop.ph_max != null) {
            if (ph >= crop.ph_min && ph <= crop.ph_max) {
                score += 2;
                reasons.push(`Soil pH ${ph} fits ${crop.name}'s ideal range (${crop.ph_min}–${crop.ph_max})`);
            } else {
                const distance = ph < crop.ph_min ? crop.ph_min - ph : ph - crop.ph_max;
                if (distance <= 0.5) {
                    score += 1;
                    reasons.push(`Soil pH ${ph} is close to ${crop.name}'s ideal range`);
                }
            }
        }

        if (season && crop.season && crop.season.toLowerCase() === season.toLowerCase()) {
            score += 1;
            reasons.push(`Matches ${season} season`);
        }

        return { crop, score, reasons };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

/**
 * Rule-based fertilizer guidance from N/P/K levels.
 * Thresholds are simplified decision-support bands, not lab-grade agronomy.
 */
function recommendFertilizer(soilReport) {
    const { nitrogen, phosphorus, potassium } = soilReport;
    const advice = [];

    function classify(value, low, high) {
        if (value == null) return 'unknown';
        if (value < low) return 'low';
        if (value > high) return 'high';
        return 'medium';
    }

    const nLevel = classify(nitrogen, 140, 280); // kg/ha bands (simplified)
    const pLevel = classify(phosphorus, 10, 25);
    const kLevel = classify(potassium, 110, 280);

    if (nLevel === 'low') advice.push({ nutrient: 'Nitrogen (N)', level: nLevel, suggestion: 'Apply Urea or a nitrogen-rich fertilizer in split doses.' });
    else if (nLevel === 'high') advice.push({ nutrient: 'Nitrogen (N)', level: nLevel, suggestion: 'Reduce nitrogen application to avoid excess vegetative growth.' });
    else advice.push({ nutrient: 'Nitrogen (N)', level: nLevel, suggestion: 'Maintain current nitrogen levels with standard dosing.' });

    if (pLevel === 'low') advice.push({ nutrient: 'Phosphorus (P)', level: pLevel, suggestion: 'Apply DAP or Single Super Phosphate (SSP) at sowing.' });
    else if (pLevel === 'high') advice.push({ nutrient: 'Phosphorus (P)', level: pLevel, suggestion: 'Phosphorus is sufficient — avoid additional phosphate fertilizer this season.' });
    else advice.push({ nutrient: 'Phosphorus (P)', level: pLevel, suggestion: 'Phosphorus levels are adequate for most crops.' });

    if (kLevel === 'low') advice.push({ nutrient: 'Potassium (K)', level: kLevel, suggestion: 'Apply Muriate of Potash (MOP) to improve potassium levels.' });
    else if (kLevel === 'high') advice.push({ nutrient: 'Potassium (K)', level: kLevel, suggestion: 'Potassium is high — additional potash is not needed.' });
    else advice.push({ nutrient: 'Potassium (K)', level: kLevel, suggestion: 'Potassium levels are within a healthy range.' });

    return {
        summary: 'NPK 19:19:19 or a balanced blend is a reasonable general starting point; adjust using the guidance below.',
        advice,
        disclaimer: 'This is automated decision support based on your soil report. For precise dosing, consult a qualified agronomist or your local Krishi Vigyan Kendra.'
    };
}

module.exports = { recommendCrops, recommendFertilizer };
