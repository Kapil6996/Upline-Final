/* ===== Symptom Extraction Engine — Multilingual ===== */
let symptomDatabase = null;

// Hindi / Hinglish keyword expansions for each symptom ID
const HINDI_KEYWORDS = {
    chest_pain: ['seene mein dard', 'seene mein dard', 'dil mein dard', 'sina dard', 'seena dukh raha'],
    breathing_difficulty: ['saans lene mein takleef', 'saans nahi aa raha', 'dam ghut raha', 'saans phool raha', 'dama', 'nas phuli'],
    unconsciousness: ['behosh', 'behoshi', 'gir gaya', 'hosh nahi', 'unconscious ho gaya'],
    severe_bleeding: ['bahut khoon aa raha', 'zyada khoon', 'khoon nahi ruk raha', 'khoon beh raha'],
    seizure: ['mirgi', 'dora pada', 'jhatkay', 'jhatkay aana'],
    stroke_symptoms: ['lakwa', 'ek taraf kamzori', 'bolta nahi', 'chehra tedha'],
    high_fever: ['tez bukhar', 'bahut tez bukhar', '104 bukhar', 'jalaa raha hai'],
    headache: ['sir dard', 'sar dard', 'sar mein dard'],
    severe_headache: ['bahut tez sir dard', 'sir phat raha hai'],
    vomiting: ['ulti', 'ulti aa rahi', 'ji machla raha'],
    diarrhea: ['dast', 'loose motion', 'pet kharab', 'paani jaisa dast'],
    severe_abdominal_pain: ['pet mein bahut dard', 'pet dard bahut zyada'],
    fracture: ['haddi toot gayi', 'haddi tooti', 'haddi se awaaz aayi'],
    snake_bite: ['saanp ne kata', 'saanp ka kaata'],
    heat_stroke: ['loo lagi', 'garmi se behosh', 'dhoop mein girna'],
    electric_shock: ['current laga', 'bijli ka jhatkaa'],
    diabetic_emergency: ['sugar bahut kam', 'sugar bahut zyada', 'sugar patient', 'madhumeh'],
    asthma_attack: ['dama ka dora', 'inhaler kaam nahi kar raha', 'dama'],
    pregnancy_emergency: ['prasav', 'delivery ho rahi', 'pani toota', 'dard ho raha garbhavati'],
    dehydration: ['paani ki kami', 'bahut pyaas', 'peshab nahi ho raha'],
    mild_fever: ['thodaa bukhar', 'halka bukhar', 'bukhar hai'],
    cough: ['khansi', 'khansi nahi ruk rahi', 'bahut khansi'],
    sore_throat: ['gala kharab', 'gala dard', 'gale mein dard'],
    back_pain: ['kamar dard', 'peeth dard', 'kamar akad gayi'],
    abdominal_pain: ['pet dard', 'navel ke paas dard'],
    dizziness: ['chakkar', 'sir ghoom raha', 'chakkar aa raha'],
    joint_pain: ['jodon mein dard', 'ghutno mein dard', 'jod dard'],
    urinary_problems: ['peshab mein jalan', 'peshab mein khoon', 'peshab nahi ho raha'],
    palpitations: ['dil dhadak raha', 'dil tez chal raha', 'dil ki dharkan tez'],
    ear_pain: ['kaan mein dard', 'kaan dard'],
    tooth_pain: ['daant dard', 'dant dard'],
    insect_bite: ['kide ne kata', 'bichhu ne kata', 'kutton ne kata'],
    cut_wound: ['kaat laga', 'chot lagi', 'ghav hai'],
    confusion: ['samajh nahi aa raha', 'bewajah bol raha', 'hosh thik nahi'],
    eye_injury: ['aankh mein chot', 'aankh se khoon'],
    numbness: ['haath sonn ho gaya', 'pair sonn ho gaya', 'sunn']
};

// Tamil basic keywords
const TAMIL_KEYWORDS = {
    chest_pain: ['maarbu vali', 'nenju vali'],
    breathing_difficulty: ['maarppu iyakam', 'swaasam edukka mudiyavillai'],
    unconsciousness: ['mayakkam', 'ninavu illai'],
    high_fever: ['adhiga juram', 'juram'],
    headache: ['thalai vali'],
    vomiting: ['vanthi'],
    snake_bite: ['paambu kaditha'],
    seizure: ['valippu'],
    diarrhea: ['pasai malam'],
    fracture: ['etumbu murindha']
};

// Telugu basic keywords
const TELUGU_KEYWORDS = {
    chest_pain: ['rotti lo noppi', 'gundhe noppi'],
    breathing_difficulty: ['swasa teesukovadaniki kashtam'],
    unconsciousness: ['murchha', 'telu chukkovadaniki'],
    high_fever: ['adhika jvaram', 'jvaram'],
    headache: ['tala noppi'],
    vomiting: ['vamti'],
    snake_bite: ['pamu kadite'],
    seizure: ['murchana'],
    diarrhea: ['virichallu']
};

const SymptomEngine = {
    async init() {
        if (!symptomDatabase) {
            const res = await fetch('./data/symptoms.json');
            symptomDatabase = await res.json();
        }
    },

    /**
     * Extract symptoms from raw text (multilingual: English, Hindi, Tamil, Telugu).
     */
    extract(text) {
        if (!symptomDatabase) return [];

        const input = text.toLowerCase().trim();
        if (!input) return [];

        const matched = [];
        const matchedIds = new Set();

        for (const symptom of symptomDatabase.symptoms) {
            if (matchedIds.has(symptom.id)) continue;

            // English: keywords + synonyms
            const englishMatch =
                symptom.keywords.some(kw => input.includes(kw)) ||
                symptom.synonyms.some(syn => input.includes(syn.toLowerCase()));

            // Hindi / Hinglish
            const hindiKws = HINDI_KEYWORDS[symptom.id] || [];
            const hindiMatch = hindiKws.some(kw => input.includes(kw));

            // Tamil
            const tamilKws = TAMIL_KEYWORDS[symptom.id] || [];
            const tamilMatch = tamilKws.some(kw => input.includes(kw));

            // Telugu
            const teluguKws = TELUGU_KEYWORDS[symptom.id] || [];
            const teluguMatch = teluguKws.some(kw => input.includes(kw));

            if (englishMatch || hindiMatch || tamilMatch || teluguMatch) {
                matchedIds.add(symptom.id);
                matched.push({
                    id: symptom.id,
                    name: symptom.name,
                    severity: symptom.severity,
                    bodySystem: symptom.bodySystem
                });
            }
        }

        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        matched.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

        return matched;
    },

    getAllSymptoms() {
        if (!symptomDatabase) return [];
        return symptomDatabase.symptoms.map(s => ({ id: s.id, name: s.name, severity: s.severity }));
    }
};
