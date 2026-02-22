/* ===== Web Speech API Wrapper ===== */
const SpeechEngine = {
    recognition: null,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    onResult: null,
    onEnd: null,
    onError: null,
    onStart: null,

    /**
     * Check if speech recognition is supported.
     */
    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },

    /**
     * Initialize speech recognition.
     * @param {string} lang - Language code (e.g., 'en-IN', 'hi-IN')
     */
    init(lang = 'en-IN') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser.');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = lang;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStart) this.onStart();
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript + ' ';
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                this.transcript += final;
            }
            this.interimTranscript = interim;

            if (this.onResult) {
                this.onResult({
                    final: this.transcript.trim(),
                    interim: this.interimTranscript.trim(),
                    full: (this.transcript + interim).trim()
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            if (this.onError) this.onError(event.error);

            // Auto-restart on non-fatal errors
            if (event.error === 'no-speech' && this.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) this.onEnd(this.transcript.trim());
        };

        return true;
    },

    /**
     * Start listening.
     */
    start() {
        if (!this.recognition) return false;

        this.transcript = '';
        this.interimTranscript = '';

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            console.warn('Speech start error:', e);
            return false;
        }
    },

    /**
     * Stop listening.
     */
    stop() {
        if (!this.recognition) return;
        try {
            this.recognition.stop();
        } catch (e) {
            // Ignore
        }
        this.isListening = false;
    },

    /**
     * Change language.
     */
    setLanguage(lang) {
        if (this.recognition) {
            const wasListening = this.isListening;
            if (wasListening) this.stop();
            this.recognition.lang = lang;
            if (wasListening) {
                setTimeout(() => this.start(), 200);
            }
        }
    },

    /**
     * Get the final transcript.
     */
    getTranscript() {
        return (this.transcript + ' ' + this.interimTranscript).trim();
    },

    /**
     * Reset transcript.
     */
    reset() {
        this.transcript = '';
        this.interimTranscript = '';
    }
};

/* ===== Text-to-Speech (TTS) Engine ===== */
const TTS = {
    isSpeaking: false,
    currentUtterance: null,
    _voicesLoaded: false,

    /**
     * Use a getter so we always get the live speechSynthesis reference,
     * even if it wasn't available at script-load time.
     */
    get synth() {
        return window.speechSynthesis || null;
    },

    /** Returns true if TTS is supported in this browser. */
    isSupported() {
        return !!window.speechSynthesis;
    },

    /**
     * Get preferred voice for a language code.
     * Falls back through: exact match → language prefix → default → first available.
     */
    getVoice(langCode) {
        if (!this.synth) return null;
        const voices = this.synth.getVoices();
        if (!voices.length) return null;

        let voice = voices.find(v => v.lang === langCode);
        if (voice) return voice;

        const shortLang = langCode.split('-')[0];
        voice = voices.find(v => v.lang.startsWith(shortLang));
        if (voice) return voice;

        return voices.find(v => v.default) || voices[0] || null;
    },

    /** Map UPLINE language codes to BCP-47 TTS codes */
    mapLanguageCode(appLang) {
        const map = {
            'en-IN': 'en-IN',
            'hi-IN': 'hi-IN',
            'bn-IN': 'bn-IN',
            'ta-IN': 'ta-IN',
            'te-IN': 'te-IN'
        };
        return map[appLang] || 'en-US';
    },

    /**
     * Wait for voices to load (they load asynchronously on many browsers).
     * Resolves immediately if voices are already available.
     */
    _waitForVoices() {
        return new Promise((resolve) => {
            if (!this.synth) { resolve([]); return; }
            const voices = this.synth.getVoices();
            if (voices.length > 0) { resolve(voices); return; }
            // Voices not ready yet — wait for the event
            const handler = () => {
                resolve(this.synth.getVoices());
                this.synth.removeEventListener('voiceschanged', handler);
            };
            this.synth.addEventListener('voiceschanged', handler);
            // Safety timeout — give up waiting after 2 s and speak with default voice
            setTimeout(() => {
                this.synth.removeEventListener('voiceschanged', handler);
                resolve(this.synth.getVoices());
            }, 2000);
        });
    },

    /**
     * Speak text. Always calls onEnd when finished OR on failure.
     * This is important because callers (e.g. voice.js) chain analyzeSymptoms() in onEnd.
     *
     * @param {string} text - Text to read aloud
     * @param {function} [onEnd] - Called when speech ends OR on any error
     */
    async speak(text, onEnd = null) {
        const done = () => { if (onEnd) onEnd(); };

        if (!this.isSupported()) {
            console.warn('[TTS] speechSynthesis not supported — skipping TTS');
            done(); // always fire callback so downstream logic still runs
            return;
        }

        // Cancel any ongoing speech
        this.stop();

        // Wait for voices to be ready
        await this._waitForVoices();

        const appLang = (typeof Storage !== 'undefined' && Storage.getLanguage)
            ? Storage.getLanguage() || 'en-IN'
            : 'en-IN';
        const ttsLang = this.mapLanguageCode(appLang);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = ttsLang;
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voice = this.getVoice(ttsLang);
        if (voice) utterance.voice = voice;

        this.currentUtterance = utterance;

        utterance.onstart = () => { this.isSpeaking = true; };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            done();
        };

        utterance.onerror = (e) => {
            console.warn('[TTS] Error:', e.error || e);
            this.isSpeaking = false;
            this.currentUtterance = null;
            done(); // fire callback even on error so analyzeSymptoms still runs
        };

        try {
            this.synth.speak(utterance);

            // Chrome bug: speechSynthesis sometimes stalls on long texts.
            // Workaround: call resume() 100ms after speaking.
            setTimeout(() => {
                if (this.synth && this.isSpeaking) this.synth.resume();
            }, 100);
        } catch (err) {
            console.warn('[TTS] speak() threw:', err);
            done();
        }
    },

    /** Cancel any ongoing speech */
    stop() {
        if (!this.synth) return;
        try { this.synth.cancel(); } catch (e) { /* ignore */ }
        this.isSpeaking = false;
        this.currentUtterance = null;
    }
};

