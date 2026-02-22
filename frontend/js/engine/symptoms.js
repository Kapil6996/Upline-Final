/* ===== Symptom Extraction Engine — Natural Language + Multilingual ===== */
/*
 * Multi-layer matching:
 *   Layer 1 — Exact keyword / synonym substring match
 *   Layer 2 — Semantic: body-part word + problem word combinations
 *   Layer 3 — Pure symptom-type words that are unambiguous on their own
 *   Layer 4 — Hindi / Tamil / Telugu keyword match
 *
 * All data is embedded inline — no fetch() required.
 */

/* ── Symptom Database ─────────────────────────────────────────── */
const SYMPTOM_DATABASE = [
    {
        id: 'chest_pain', name: 'Chest Pain', severity: 'high', bodySystem: 'cardiovascular',
        keywords: ['chest pain', 'pain in my chest', 'chest hurts', 'chest ache', 'chest tightness',
            'chest pressure', 'pain in chest', 'heart pain', 'heart hurts', 'my chest hurts',
            'hurting in chest', 'chest is paining', 'chest is hurting', 'pain around chest',
            'tightness in my chest', 'heavy feeling in chest', 'pressure on chest'],
        synonyms: ['heart attack', 'cardiac pain', 'angina']
    },
    {
        id: 'breathing_difficulty', name: 'Breathing Difficulty', severity: 'high', bodySystem: 'respiratory',
        keywords: ['breathing difficulty', 'difficulty breathing', 'difficulty in breathing',
            'trouble breathing', 'cant breathe', "can't breathe", 'hard to breathe', 'breath problem',
            'breathless', 'breathlessness', 'shortness of breath', 'short of breath', 'suffocation',
            'suffocating', 'not able to breathe', 'unable to breathe', 'struggling to breathe',
            'having trouble breathing', 'breathing problem', 'trouble with breathing',
            'out of breath', 'losing breath', 'breath is short', 'hard to get air',
            'not getting enough air', 'air not coming', 'cant get air', 'airways blocked',
            'labored breathing', 'laboured breathing', 'breathing is difficult', 'breathing issues',
            'problem in breathing'],
        synonyms: ['dyspnea', 'respiratory distress', 'asthma attack', 'wheezing']
    },
    {
        id: 'unconsciousness', name: 'Unconsciousness', severity: 'critical', bodySystem: 'neurological',
        keywords: ['unconscious', 'not conscious', 'fainted', 'fainting', 'passed out', 'unresponsive',
            'not responding', 'collapsed', 'collapse', 'not waking up', 'lost consciousness',
            'blacked out', 'person is unconscious', 'fell unconscious'],
        synonyms: ['syncope', 'blackout', 'knocked out', 'coma']
    },
    {
        id: 'severe_bleeding', name: 'Severe Bleeding', severity: 'critical', bodySystem: 'trauma',
        keywords: ['severe bleeding', 'heavy bleeding', 'bleeding a lot', 'blood loss',
            "won't stop bleeding", 'profuse bleeding', 'massive bleeding', 'blood everywhere',
            'bleeding heavily', 'bleeding badly', 'too much bleeding', 'blood not stopping',
            'bleeding continuously', 'cant stop bleeding'],
        synonyms: ['hemorrhage', 'haemorrhage']
    },
    {
        id: 'head_injury', name: 'Head Injury', severity: 'high', bodySystem: 'neurological',
        keywords: ['head injury', 'head wound', 'hit head', 'head trauma', 'skull injury',
            'head bleeding', 'bump on head', 'cracked skull', 'hit my head', 'injured my head',
            'head is bleeding', 'fell on head', 'banged head'],
        synonyms: ['concussion', 'traumatic brain injury', 'tbi']
    },
    {
        id: 'seizure', name: 'Seizure', severity: 'high', bodySystem: 'neurological',
        keywords: ['seizure', 'seizures', 'convulsion', 'convulsions', 'fits', 'fitting',
            'shaking uncontrollably', 'epilepsy', 'epileptic', 'having a fit', 'body shaking',
            'body is shaking', 'trembling all over', 'uncontrolled shaking', 'jerking movements'],
        synonyms: ['epileptic fit', 'grand mal', 'tonic clonic']
    },
    {
        id: 'stroke_symptoms', name: 'Stroke Symptoms', severity: 'critical', bodySystem: 'neurological',
        keywords: ['stroke', 'face drooping', 'arm weakness', 'speech difficulty', 'slurred speech',
            'one side weak', 'facial droop', 'cant move arm', 'cant speak properly', 'sudden weakness',
            'face is drooping', 'cant lift arm', 'one arm not working', 'speech is slurred',
            'cannot speak properly', 'sudden numbness one side'],
        synonyms: ['brain attack', 'cerebrovascular accident', 'tia']
    },
    {
        id: 'severe_burn', name: 'Severe Burn', severity: 'high', bodySystem: 'trauma',
        keywords: ['severe burn', 'bad burn', 'burn injury', 'deep burn', 'large burn', 'burnt badly',
            'skin burnt', 'fire burn', 'chemical burn', 'got burned', 'burned badly', 'bad burn on skin'],
        synonyms: ['third degree burn', 'second degree burn']
    },
    {
        id: 'choking', name: 'Choking', severity: 'critical', bodySystem: 'respiratory',
        keywords: ['choking', 'choked', 'something stuck in throat', 'cant swallow', 'food stuck',
            'airway blocked', 'gagging', 'something in throat', 'food is stuck', 'throat is blocked',
            'cant breathe something stuck'],
        synonyms: ['foreign body airway obstruction', 'aspiration']
    },
    {
        id: 'allergic_reaction', name: 'Severe Allergic Reaction', severity: 'high', bodySystem: 'immune',
        keywords: ['allergic reaction', 'allergy', 'severe allergy', 'swelling face', 'swelling throat',
            'hives all over', 'anaphylaxis', 'throat swelling', 'tongue swelling', 'lips swelling',
            'face swelling', 'swollen throat', 'swollen face', 'face is swollen', 'lips are swollen'],
        synonyms: ['anaphylactic shock', 'anaphylaxis']
    },
    {
        id: 'poisoning', name: 'Poisoning', severity: 'high', bodySystem: 'toxicology',
        keywords: ['poisoning', 'poisoned', 'swallowed poison', 'ate poison', 'drank poison',
            'ingested chemical', 'chemical poisoning', 'food poisoning severe', 'toxic substance',
            'ate something toxic', 'drank something toxic', 'accidentally swallowed'],
        synonyms: ['intoxication', 'overdose', 'drug overdose']
    },
    {
        id: 'snake_bite', name: 'Snake Bite', severity: 'high', bodySystem: 'toxicology',
        keywords: ['snake bite', 'snake bitten', 'bitten by snake', 'serpent bite', 'saanp kata',
            'snakebite', 'a snake bit', 'snake has bitten'],
        synonyms: ['envenomation', 'snakebite']
    },
    {
        id: 'drowning', name: 'Drowning', severity: 'critical', bodySystem: 'respiratory',
        keywords: ['drowning', 'drowned', 'almost drowned', 'near drowning', 'swallowed water',
            'submerged in water', 'fell in water', 'person is drowning'],
        synonyms: ['submersion', 'near-drowning']
    },
    {
        id: 'high_fever', name: 'High Fever', severity: 'medium', bodySystem: 'general',
        keywords: ['high fever', 'very high fever', 'fever above 103', 'fever 104', 'fever 105',
            'burning up', 'extremely hot', 'high temperature', 'bukhar', 'tez bukhar',
            'very high temperature', 'really high fever', 'body temperature very high',
            'temperature is 104', 'temperature is 103', 'temperature is 105'],
        synonyms: ['hyperthermia', 'pyrexia', 'febrile']
    },
    {
        id: 'stiff_neck', name: 'Stiff Neck', severity: 'medium', bodySystem: 'neurological',
        keywords: ['stiff neck', 'neck stiff', 'neck rigidity', 'cant move neck', 'neck pain severe',
            'neck hurts a lot', 'neck is stiff', 'cant turn neck'],
        synonyms: ['nuchal rigidity', 'meningismus']
    },
    {
        id: 'headache', name: 'Headache', severity: 'low', bodySystem: 'neurological',
        keywords: ['headache', 'head ache', 'head pain', 'head hurts', 'sir dard', 'migraine',
            'throbbing head', 'pounding headache', 'my head hurts', 'pain in head', 'pain in my head',
            'head is paining', 'head is aching'],
        synonyms: ['cephalalgia', 'migraine']
    },
    {
        id: 'severe_headache', name: 'Severe Headache', severity: 'high', bodySystem: 'neurological',
        keywords: ['severe headache', 'worst headache', 'thunderclap headache', 'sudden severe headache',
            'extreme headache', 'unbearable headache', 'very bad headache', 'really bad headache',
            'worst headache of my life', 'head is splitting', 'head is about to burst'],
        synonyms: ['thunderclap cephalalgia']
    },
    {
        id: 'vomiting', name: 'Vomiting', severity: 'low', bodySystem: 'gastrointestinal',
        keywords: ['vomiting', 'vomit', 'throwing up', 'puking', 'nausea', 'feeling sick', 'ulti',
            'feel like vomiting', 'want to vomit', 'feeling nauseous', 'i am vomiting',
            'im throwing up', 'feel nauseous', 'going to vomit', 'about to vomit', 'nauseous'],
        synonyms: ['emesis']
    },
    {
        id: 'vomiting_blood', name: 'Vomiting Blood', severity: 'high', bodySystem: 'gastrointestinal',
        keywords: ['vomiting blood', 'blood in vomit', 'throwing up blood', 'puking blood', 'red vomit',
            'blood while vomiting'],
        synonyms: ['hematemesis', 'haematemesis']
    },
    {
        id: 'diarrhea', name: 'Diarrhea', severity: 'low', bodySystem: 'gastrointestinal',
        keywords: ['diarrhea', 'diarrhoea', 'loose stool', 'loose motion', 'watery stool',
            'upset stomach', 'stomach running', 'pet kharab', 'loose motions', 'having loose motions',
            'frequent loose stools'],
        synonyms: ['gastroenteritis']
    },
    {
        id: 'severe_abdominal_pain', name: 'Severe Abdominal Pain', severity: 'high', bodySystem: 'gastrointestinal',
        keywords: ['severe abdominal pain', 'severe stomach pain', 'stomach pain severe',
            'abdomen pain severe', 'belly pain severe', 'cramping severe', 'pet mein bahut dard',
            'unbearable stomach pain', 'extreme stomach pain', 'stomach hurts badly'],
        synonyms: ['acute abdomen']
    },
    {
        id: 'fracture', name: 'Fracture / Broken Bone', severity: 'medium', bodySystem: 'musculoskeletal',
        keywords: ['fracture', 'broken bone', 'bone broken', 'bone crack', 'cracked bone',
            'cant move arm', 'cant move leg', 'deformed limb', 'haddi tuti', 'broke my arm',
            'broke my leg', 'bone is broken', 'i think i broke', 'i broke my'],
        synonyms: ['bone fracture', 'compound fracture', 'simple fracture']
    },
    {
        id: 'spinal_injury', name: 'Spinal Injury', severity: 'critical', bodySystem: 'neurological',
        keywords: ['spinal injury', 'spine injury', 'back injury', 'cant feel legs', 'paralyzed',
            'paralysis', 'cant move legs', 'numbness below waist', 'spinal cord injury',
            'no feeling in legs', 'legs are numb'],
        synonyms: ['spinal cord trauma', 'vertebral fracture']
    },
    {
        id: 'eye_injury', name: 'Eye Injury', severity: 'medium', bodySystem: 'ophthalmological',
        keywords: ['eye injury', 'eye hurt', 'something in eye', 'chemical in eye', 'eye bleeding',
            'cant see', 'vision loss', 'blurry vision sudden', 'eye pain severe', 'eyes are bleeding',
            'cant open eye', 'eye is injured'],
        synonyms: ['ocular trauma', 'corneal injury']
    },
    {
        id: 'heat_stroke', name: 'Heat Stroke', severity: 'high', bodySystem: 'general',
        keywords: ['heat stroke', 'heatstroke', 'sun stroke', 'overheated', 'hot and not sweating',
            'very hot skin', 'confusion heat', 'loo lagna', 'too much heat', 'passed out in sun'],
        synonyms: ['hyperthermia', 'sunstroke']
    },
    {
        id: 'hypothermia', name: 'Hypothermia', severity: 'high', bodySystem: 'general',
        keywords: ['hypothermia', 'very cold', 'freezing', 'body temperature low',
            'shivering uncontrollably', 'cold exposure', 'frostbite', 'extremely cold'],
        synonyms: ['cold exposure', 'frostbite']
    },
    {
        id: 'electric_shock', name: 'Electric Shock', severity: 'high', bodySystem: 'trauma',
        keywords: ['electric shock', 'electrocuted', 'electrocution', 'current laga',
            'shocked by electricity', 'electrical injury', 'lightning strike', 'got electric shock',
            'touched live wire'],
        synonyms: ['electrocution']
    },
    {
        id: 'insect_bite', name: 'Insect/Animal Bite', severity: 'medium', bodySystem: 'toxicology',
        keywords: ['insect bite', 'bee sting', 'wasp sting', 'scorpion sting', 'dog bite',
            'animal bite', 'spider bite', 'bitten by dog', 'bitten by animal', 'got stung',
            'dog attacked', 'bitten by insect'],
        synonyms: ['envenomation', 'rabies exposure']
    },
    {
        id: 'diabetic_emergency', name: 'Diabetic Emergency', severity: 'high', bodySystem: 'endocrine',
        keywords: ['diabetic emergency', 'low blood sugar', 'high blood sugar', 'sugar very low',
            'sugar very high', 'diabetic coma', 'sugar patient unconscious', 'hypoglycemia',
            'hyperglycemia', 'blood sugar is low', 'blood sugar is high', 'sugar dropped'],
        synonyms: ['diabetic ketoacidosis', 'dka', 'hypoglycemic shock']
    },
    {
        id: 'asthma_attack', name: 'Asthma Attack', severity: 'high', bodySystem: 'respiratory',
        keywords: ['asthma attack', 'asthma', 'wheezing bad', 'cant breathe asthma',
            'inhaler not working', 'asthma emergency', 'dama', 'having asthma attack',
            'asthma is acting up', 'wheezing badly'],
        synonyms: ['bronchospasm', 'status asthmaticus']
    },
    {
        id: 'pregnancy_emergency', name: 'Pregnancy Emergency', severity: 'high', bodySystem: 'obstetric',
        keywords: ['pregnancy emergency', 'pregnant bleeding', 'water broke', 'labor pain',
            'contractions', 'baby coming', 'premature labor', 'placenta', 'water has broken',
            'going into labor', 'in labor'],
        synonyms: ['obstetric emergency', 'preeclampsia', 'eclampsia']
    },
    {
        id: 'cut_wound', name: 'Cut / Wound', severity: 'low', bodySystem: 'trauma',
        keywords: ['cut', 'wound', 'laceration', 'deep cut', 'gash', 'skin cut', 'knife cut',
            'glass cut', 'got cut', 'i cut', 'there is a cut', 'bleeding from cut', 'open wound'],
        synonyms: ['laceration', 'incision']
    },
    {
        id: 'mild_fever', name: 'Mild Fever', severity: 'low', bodySystem: 'general',
        keywords: ['mild fever', 'slight fever', 'low fever', 'fever', 'low grade fever',
            'feeling feverish', 'halka bukhar', 'have fever', 'got fever', 'running fever',
            'i have a fever', 'feeling hot', 'body is warm', 'slight temperature'],
        synonyms: ['low grade pyrexia']
    },
    {
        id: 'cough', name: 'Cough', severity: 'low', bodySystem: 'respiratory',
        keywords: ['cough', 'coughing', 'khansi', 'dry cough', 'wet cough', 'persistent cough',
            'cough wont stop', 'cant stop coughing', 'i have a cough', 'started coughing',
            'coughing a lot', 'coughing constantly'],
        synonyms: ['tussis']
    },
    {
        id: 'sore_throat', name: 'Sore Throat', severity: 'low', bodySystem: 'respiratory',
        keywords: ['sore throat', 'throat pain', 'throat hurts', 'gala dard', 'throat infection',
            'pain in throat', 'my throat hurts', 'throat is sore', 'throat is paining',
            'painful throat', 'throat is hurting'],
        synonyms: ['pharyngitis', 'tonsillitis']
    },
    {
        id: 'rash', name: 'Skin Rash', severity: 'low', bodySystem: 'dermatological',
        keywords: ['rash', 'skin rash', 'red spots', 'itchy skin', 'hives', 'skin irritation',
            'skin bumps', 'itching all over', 'itchiness', 'my skin is itchy', 'red patches on skin',
            'skin is itching'],
        synonyms: ['dermatitis', 'urticaria', 'eczema']
    },
    {
        id: 'back_pain', name: 'Back Pain', severity: 'low', bodySystem: 'musculoskeletal',
        keywords: ['back pain', 'lower back pain', 'kamar dard', 'backache', 'spine pain',
            'my back hurts', 'pain in back', 'pain in my back', 'back is aching', 'back is paining',
            'pain in lower back'],
        synonyms: ['lumbago', 'sciatica']
    },
    {
        id: 'abdominal_pain', name: 'Abdominal Pain', severity: 'low', bodySystem: 'gastrointestinal',
        keywords: ['stomach pain', 'belly pain', 'abdominal pain', 'tummy ache', 'pet dard',
            'stomach ache', 'stomachache', 'my stomach hurts', 'pain in stomach', 'pain in belly',
            'stomach is paining', 'pain in my stomach', 'my tummy hurts', 'abdomen is paining'],
        synonyms: ['gastritis', 'colic']
    },
    {
        id: 'dizziness', name: 'Dizziness', severity: 'low', bodySystem: 'neurological',
        keywords: ['dizziness', 'dizzy', 'lightheaded', 'light headed', 'feeling faint',
            'room spinning', 'vertigo', 'chakkar', 'feel dizzy', 'head spinning', 'i am dizzy',
            'everything is spinning', 'balance problem', 'losing balance', 'feeling very dizzy'],
        synonyms: ['vertigo', 'presyncope']
    },
    {
        id: 'chest_tightness', name: 'Chest Tightness', severity: 'medium', bodySystem: 'cardiovascular',
        keywords: ['chest tightness', 'tight chest', 'chest feels tight', 'pressure in chest',
            'heavy chest', 'tightness in chest', 'chest feels heavy', 'chest is tight',
            'something pressing on chest'],
        synonyms: ['chest constriction']
    },
    {
        id: 'palpitations', name: 'Heart Palpitations', severity: 'medium', bodySystem: 'cardiovascular',
        keywords: ['palpitations', 'heart racing', 'heart beating fast', 'heart pounding',
            'irregular heartbeat', 'heart flutter', 'dil dhadakna', 'my heart is racing',
            'heart is beating very fast', 'i can feel my heartbeat', 'heart is pounding',
            'rapid heartbeat', 'fast heartbeat', 'heart skipping'],
        synonyms: ['tachycardia', 'arrhythmia']
    },
    {
        id: 'confusion', name: 'Confusion / Disorientation', severity: 'medium', bodySystem: 'neurological',
        keywords: ['confusion', 'confused', 'disoriented', 'not making sense', 'delirious',
            'altered mental state', 'acting strange', 'feeling confused', 'i am confused',
            'person is confused', 'not aware of surroundings', 'not recognizing people'],
        synonyms: ['delirium', 'altered consciousness']
    },
    {
        id: 'numbness', name: 'Numbness / Tingling', severity: 'medium', bodySystem: 'neurological',
        keywords: ['numbness', 'tingling', 'pins and needles', 'cant feel', 'numb hands',
            'numb feet', 'numb face', 'hand is numb', 'foot is numb', 'leg is numb',
            'arm is numb', 'feel numb', 'my hand feels numb', 'fingers are numb'],
        synonyms: ['paresthesia']
    },
    {
        id: 'blood_in_stool', name: 'Blood in Stool', severity: 'medium', bodySystem: 'gastrointestinal',
        keywords: ['blood in stool', 'bloody stool', 'black stool', 'tarry stool',
            'rectal bleeding', 'blood when pooping', 'blood in toilet', 'bleeding from bottom'],
        synonyms: ['hematochezia', 'melena']
    },
    {
        id: 'difficulty_swallowing', name: 'Difficulty Swallowing', severity: 'medium', bodySystem: 'gastrointestinal',
        keywords: ['difficulty swallowing', 'cant swallow', 'painful swallowing',
            'food getting stuck', 'throat blocked', 'hard to swallow', 'trouble swallowing',
            'cant swallow food', 'swallowing is painful'],
        synonyms: ['dysphagia', 'odynophagia']
    },
    {
        id: 'ear_pain', name: 'Ear Pain', severity: 'low', bodySystem: 'ENT',
        keywords: ['ear pain', 'earache', 'ear hurts', 'kaan dard', 'ear infection', 'my ear hurts',
            'ear is paining', 'pain in ear', 'pain inside ear'],
        synonyms: ['otalgia', 'otitis']
    },
    {
        id: 'tooth_pain', name: 'Tooth Pain', severity: 'low', bodySystem: 'dental',
        keywords: ['tooth pain', 'toothache', 'daant dard', 'tooth hurts', 'dental pain',
            'my tooth hurts', 'teeth are hurting', 'pain in tooth'],
        synonyms: ['dental caries', 'pulpitis']
    },
    {
        id: 'joint_pain', name: 'Joint Pain', severity: 'low', bodySystem: 'musculoskeletal',
        keywords: ['joint pain', 'joints hurting', 'knee pain', 'elbow pain', 'shoulder pain',
            'jodon mein dard', 'swollen joint', 'my knee hurts', 'knee is paining',
            'joints are aching', 'joint is swollen'],
        synonyms: ['arthralgia', 'arthritis']
    },
    {
        id: 'urinary_problems', name: 'Urinary Problems', severity: 'low', bodySystem: 'urological',
        keywords: ['urinary problem', 'painful urination', 'blood in urine', 'cant urinate',
            'frequent urination', 'burning urine', 'peshab mein jalan', 'burning when urinating',
            'pain when urinating', 'blood when i pee', 'cant pass urine'],
        synonyms: ['dysuria', 'hematuria', 'uti']
    },
    {
        id: 'dehydration', name: 'Dehydration', severity: 'medium', bodySystem: 'general',
        keywords: ['dehydration', 'dehydrated', 'very thirsty', 'dry mouth', 'no urine',
            'sunken eyes', 'paani ki kami', 'extremely thirsty', 'not urinating',
            'feeling dehydrated', 'too thirsty', 'mouth is dry'],
        synonyms: ['hypovolemia']
    }
];

/* ── Hindi / Hinglish expansions ─────────────────────────────── */
const HINDI_KEYWORDS = {
    chest_pain: ['seene mein dard', 'dil mein dard', 'sina dard', 'seena dukh raha'],
    breathing_difficulty: ['saans lene mein takleef', 'saans nahi aa raha', 'dam ghut raha',
        'saans phool raha', 'dama', 'saans ki takleef', 'saans lena mushkil'],
    unconsciousness: ['behosh', 'behoshi', 'gir gaya', 'hosh nahi', 'unconscious ho gaya'],
    severe_bleeding: ['bahut khoon aa raha', 'zyada khoon', 'khoon nahi ruk raha', 'khoon beh raha'],
    seizure: ['mirgi', 'dora pada', 'jhatkay', 'jhatkay aana'],
    stroke_symptoms: ['lakwa', 'ek taraf kamzori', 'bolta nahi', 'chehra tedha'],
    high_fever: ['tez bukhar', 'bahut tez bukhar', 'jalaa raha hai'],
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
    pregnancy_emergency: ['prasav', 'delivery ho rahi', 'pani toota'],
    dehydration: ['paani ki kami', 'bahut pyaas', 'peshab nahi ho raha'],
    mild_fever: ['thodaa bukhar', 'halka bukhar', 'bukhar hai'],
    cough: ['khansi', 'khansi nahi ruk rahi', 'bahut khansi'],
    sore_throat: ['gala kharab', 'gala dard', 'gale mein dard'],
    back_pain: ['kamar dard', 'peeth dard', 'kamar akad gayi'],
    abdominal_pain: ['pet dard', 'navel ke paas dard'],
    dizziness: ['chakkar', 'sir ghoom raha', 'chakkar aa raha'],
    joint_pain: ['jodon mein dard', 'ghutno mein dard'],
    urinary_problems: ['peshab mein jalan', 'peshab mein khoon'],
    palpitations: ['dil dhadak raha', 'dil tez chal raha', 'dil ki dharkan tez'],
    ear_pain: ['kaan mein dard', 'kaan dard'],
    tooth_pain: ['daant dard', 'dant dard'],
    cut_wound: ['kaat laga', 'chot lagi', 'ghav hai'],
    confusion: ['samajh nahi aa raha', 'hosh thik nahi'],
    numbness: ['haath sonn ho gaya', 'pair sonn ho gaya']
};

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

const TELUGU_KEYWORDS = {
    chest_pain: ['rotti lo noppi', 'gundhe noppi'],
    breathing_difficulty: ['swasa teesukovadaniki kashtam'],
    unconsciousness: ['murchha'],
    high_fever: ['adhika jvaram', 'jvaram'],
    headache: ['tala noppi'],
    vomiting: ['vamti'],
    snake_bite: ['pamu kadite'],
    seizure: ['murchana'],
    diarrhea: ['virichallu']
};

/* ── Semantic Pattern Rules ───────────────────────────────────── *
 * Each rule has:
 *   bodyParts  — words that refer to a body area
 *   problems   — words that suggest a problem in that area
 *   symptomId  — the symptom to assign if both are found in input
 *
 * The engine will match if ANY bodyPart AND ANY problem word is present.
 */
const SEMANTIC_RULES = [
    {
        symptomId: 'chest_pain',
        bodyParts: ['chest', 'heart', 'left side', 'sternum', 'breast bone'],
        problems: ['pain', 'ache', 'hurt', 'sore', 'paining', 'burning', 'pressure',
            'tight', 'tightness', 'heavy', 'squeeze', 'squeezing', 'crushing', 'discomfort']
    },
    {
        symptomId: 'breathing_difficulty',
        bodyParts: ['breath', 'breathing', 'air', 'lung', 'lungs', 'respiratory', 'inhale', 'exhale'],
        problems: ['difficult', 'difficulty', 'trouble', 'hard', 'problem', 'struggle',
            'short', 'cant', 'cannot', 'not', 'unable', 'loss', 'losing', 'gasping', 'choking',
            'issue', 'bad', 'worse', 'poor', 'no', 'insufficient']
    },
    {
        symptomId: 'headache',
        bodyParts: ['head', 'skull', 'forehead', 'temple', 'temples', 'brain'],
        problems: ['pain', 'ache', 'hurt', 'paining', 'sore', 'throbbing', 'pounding',
            'heavy', 'spinning', 'pressure', 'bursting', 'splitting']
    },
    {
        symptomId: 'abdominal_pain',
        bodyParts: ['stomach', 'belly', 'abdomen', 'gut', 'tummy', 'navel', 'intestine'],
        problems: ['pain', 'ache', 'hurt', 'cramp', 'cramping', 'paining', 'sore', 'discomfort',
            'burning', 'bloating', 'upset', 'hurting']
    },
    {
        symptomId: 'back_pain',
        bodyParts: ['back', 'spine', 'lower back', 'lumbar', 'waist'],
        problems: ['pain', 'ache', 'hurt', 'sore', 'paining', 'stiff', 'stiffness',
            'cramp', 'discomfort', 'burning', 'pulled']
    },
    {
        symptomId: 'sore_throat',
        bodyParts: ['throat', 'neck'],
        problems: ['pain', 'sore', 'hurt', 'ache', 'paining', 'burning', 'scratchy',
            'itchy', 'difficult to swallow', 'swallowing']
    },
    {
        symptomId: 'ear_pain',
        bodyParts: ['ear', 'ears'],
        problems: ['pain', 'ache', 'hurt', 'hurting', 'paining', 'blocked', 'ringing',
            'buzzing', 'fluid', 'infection', 'sore']
    },
    {
        symptomId: 'eye_injury',
        bodyParts: ['eye', 'eyes', 'vision', 'sight'],
        problems: ['pain', 'hurt', 'injury', 'problem', 'blurry', 'blur', 'see', 'red',
            'bleeding', 'burning', 'stuck', 'something in', 'irritation']
    },
    {
        symptomId: 'joint_pain',
        bodyParts: ['knee', 'knees', 'elbow', 'elbows', 'shoulder', 'shoulders', 'wrist',
            'ankle', 'hip', 'joint', 'joints'],
        problems: ['pain', 'ache', 'hurt', 'sore', 'paining', 'swollen', 'stiff',
            'swelling', 'inflammation', 'tender']
    },
    {
        symptomId: 'palpitations',
        bodyParts: ['heart', 'heartbeat', 'pulse', 'chest'],
        problems: ['racing', 'fast', 'rapid', 'pounding', 'flutter', 'irregular',
            'skipping', 'beating', 'palpitation', 'very fast', 'too fast']
    },
    {
        symptomId: 'dizziness',
        bodyParts: ['head', 'balance', 'vision', 'surroundings', 'everything'],
        problems: ['spinning', 'dizzy', 'dizziness', 'lightheaded', 'faint', 'fainting',
            'whirling', 'rotating', 'unsteady', 'unstable']
    },
    {
        symptomId: 'numbness',
        bodyParts: ['hand', 'hands', 'foot', 'feet', 'leg', 'legs', 'arm', 'arms',
            'face', 'fingers', 'toes', 'body'],
        problems: ['numb', 'numbness', 'tingling', 'pins', 'needles', 'cant feel',
            'no feeling', 'sensation lost', 'lost sensation']
    },
    {
        symptomId: 'severe_bleeding',
        bodyParts: ['wound', 'cut', 'injury', 'arm', 'leg', 'head', 'body'],
        problems: ['heavy bleeding', 'bleeding a lot', 'blood wont stop', 'too much blood',
            'blood everywhere', 'blood not stopping', 'profuse blood']
    },
    {
        symptomId: 'high_fever',
        bodyParts: ['body', 'temperature', 'head', 'skin'],
        problems: ['very hot', 'extremely hot', 'burning hot', 'boiling', 'on fire',
            'high temperature', 'temperature very high']
    },
    {
        symptomId: 'mild_fever',
        bodyParts: ['body', 'temperature', 'forehead'],
        problems: ['warm', 'slight fever', 'little hot', 'hot to touch', 'bit of fever',
            'low fever', 'mild fever', 'slight temperature']
    },
    {
        symptomId: 'urinary_problems',
        bodyParts: ['urine', 'urination', 'pee', 'peeing', 'bladder', 'urinary'],
        problems: ['pain', 'burning', 'blood', 'frequent', 'cant', 'difficulty',
            'problem', 'trouble', 'hard', 'unable', 'burning sensation']
    },
    {
        symptomId: 'chest_tightness',
        bodyParts: ['chest'],
        problems: ['tight', 'tightness', 'heavy', 'constricted', 'pressure', 'squeezing',
            'feels like something pressing']
    }
];

/* ── Filler words to strip before matching ───────────────────── */
const FILLERS = /\b(i am|i'm|im|i have|i've|i got|i feel|i'm feeling|feeling|suffering from|experiencing|having|there is|there's|a lot of|my|the|some|bit of|kind of|sort of|little|very|really|quite|extremely|suddenly|recently|since|yesterday|today|for the past|started)\b/gi;

/* ── Main Engine ─────────────────────────────────────────────── */
const SymptomEngine = {
    async init() {
        return true; // data is embedded, nothing to fetch
    },

    /**
     * Normalize input: lowercase, strip fillers, collapse whitespace.
     */
    _normalize(text) {
        return text
            .toLowerCase()
            .replace(FILLERS, ' ')
            .replace(/[^\w\s]/g, ' ')   // remove punctuation
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * Layer 1 — keyword / synonym exact substring match (on raw lowercased input)
     */
    _keywordMatch(rawInput, symptom) {
        return (
            symptom.keywords.some(kw => rawInput.includes(kw.toLowerCase())) ||
            symptom.synonyms.some(syn => rawInput.includes(syn.toLowerCase()))
        );
    },

    /**
     * Layer 2 — semantic body-part × problem type match (on normalized input)
     */
    _semanticMatch(normalizedInput, symptomId) {
        const rule = SEMANTIC_RULES.find(r => r.symptomId === symptomId);
        if (!rule) return false;
        const hasBodyPart = rule.bodyParts.some(bp => normalizedInput.includes(bp));
        const hasProblem = rule.problems.some(pr => normalizedInput.includes(pr));
        return hasBodyPart && hasProblem;
    },

    /**
     * Layer 3 — multilingual keyword match (Hindi / Tamil / Telugu)
     */
    _multilingualMatch(rawInput, symptomId) {
        const h = (HINDI_KEYWORDS[symptomId] || []).some(kw => rawInput.includes(kw));
        const t = (TAMIL_KEYWORDS[symptomId] || []).some(kw => rawInput.includes(kw));
        const g = (TELUGU_KEYWORDS[symptomId] || []).some(kw => rawInput.includes(kw));
        return h || t || g;
    },

    /**
     * Main extract function — runs all layers.
     * @param {string} text
     * @returns {Array}
     */
    extract(text) {
        if (!text) return [];
        const raw = text.toLowerCase().trim();
        if (!raw) return [];

        const normalized = this._normalize(text);
        const matched = [];
        const matchedIds = new Set();

        for (const symptom of SYMPTOM_DATABASE) {
            if (matchedIds.has(symptom.id)) continue;

            const hit =
                this._keywordMatch(raw, symptom) ||
                this._semanticMatch(normalized, symptom.id) ||
                this._multilingualMatch(raw, symptom.id);

            if (hit) {
                matchedIds.add(symptom.id);
                matched.push({
                    id: symptom.id,
                    name: symptom.name,
                    severity: symptom.severity,
                    bodySystem: symptom.bodySystem
                });
            }
        }

        // Sort: critical → high → medium → low
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        matched.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

        return matched;
    },

    getAllSymptoms() {
        return SYMPTOM_DATABASE.map(s => ({ id: s.id, name: s.name, severity: s.severity }));
    }
};
