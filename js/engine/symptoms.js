/* ===== Symptom Extraction Engine ===== */
let symptomDatabase = null;

const SymptomEngine = {
    async init() {
        if (!symptomDatabase) {
            const res = await fetch('./data/symptoms.json');
            symptomDatabase = await res.json();
        }
    },

    /**
     * Extract symptoms from raw text input.
     * Uses keyword + synonym matching with fuzzy tolerance.
     * @param {string} text - Raw user input text
     * @returns {Array} - Array of matched symptom objects
     */
    extract(text) {
        if (!symptomDatabase) return [];

        const input = text.toLowerCase().trim();
        if (!input) return [];

        const matched = [];
        const matchedIds = new Set();

        for (const symptom of symptomDatabase.symptoms) {
            if (matchedIds.has(symptom.id)) continue;

            // Check keywords
            const keywordMatch = symptom.keywords.some(kw => input.includes(kw));

            // Check synonyms
            const synonymMatch = symptom.synonyms.some(syn => input.includes(syn.toLowerCase()));

            if (keywordMatch || synonymMatch) {
                matchedIds.add(symptom.id);
                matched.push({
                    id: symptom.id,
                    name: symptom.name,
                    severity: symptom.severity,
                    bodySystem: symptom.bodySystem
                });
            }
        }

        // Sort by severity: critical > high > medium > low
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        matched.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

        return matched;
    },

    /**
     * Get all symptom names for autocomplete/display.
     */
    getAllSymptoms() {
        if (!symptomDatabase) return [];
        return symptomDatabase.symptoms.map(s => ({ id: s.id, name: s.name, severity: s.severity }));
    }
};
