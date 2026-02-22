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
        return this.transcript.trim();
    },

    /**
     * Reset transcript.
     */
    reset() {
        this.transcript = '';
        this.interimTranscript = '';
    }
};
