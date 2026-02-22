/* ===== Voice Input Page ===== */
function renderVoice() {
    const page = document.createElement('div');
    page.className = 'page voice-page page-scroll';

    const speechSupported = SpeechEngine.isSupported();
    const currentLang = Storage.getLanguage();

    page.innerHTML = `
    <div class="voice-header">
      <h2>🎤 Describe Symptoms</h2>
      <p>${speechSupported ? 'Tap the mic and speak clearly' : 'Type your symptoms below'}</p>
      ${speechSupported ? `
        <div class="voice-lang-selector">
          <button class="lang-chip ${currentLang === 'en-IN' ? 'active' : ''}" data-lang="en-IN" onclick="switchLang('en-IN')">English</button>
          <button class="lang-chip ${currentLang === 'hi-IN' ? 'active' : ''}" data-lang="hi-IN" onclick="switchLang('hi-IN')">हिन्दी</button>
        </div>
      ` : ''}
    </div>

    <div class="voice-mic-area">
      ${speechSupported ? `
        <div class="waveform" id="waveform">
          ${Array.from({ length: 15 }, () => '<div class="waveform-bar"></div>').join('')}
        </div>
        
        <button class="mic-btn" id="mic-btn" onclick="toggleMic()">
          <div class="mic-btn-ring"></div>
          🎤
        </button>
        
        <div class="voice-status" id="voice-status">Tap to start listening</div>
        
        <div class="voice-transcript" id="voice-transcript">
          <span class="empty" style="color: var(--text-muted); font-style: italic;">Your words will appear here...</span>
        </div>
      ` : `
        <div style="text-align: center; margin-bottom: var(--space-lg);">
          <div style="font-size: 48px; margin-bottom: var(--space-md);">⌨️</div>
          <p style="font-size: var(--font-sm); color: var(--text-muted);">Speech recognition not available.<br>Please type your symptoms below.</p>
        </div>
      `}

      <textarea 
        class="voice-manual-input" 
        id="manual-input" 
        placeholder="Or type your symptoms here... e.g., 'I have chest pain and difficulty breathing'"
        rows="3"
      ></textarea>
    </div>

    <div class="voice-actions">
      <button class="btn btn-ghost btn-block" onclick="clearVoiceInput()" id="clear-voice-btn">
        🗑️ Clear
      </button>
      <button class="btn btn-primary btn-block btn-lg" onclick="analyzeSymptoms()" id="analyze-btn">
        🔍 Analyze
      </button>
    </div>
  `;

    return page;
}

let isRecording = false;

function toggleMic() {
    const micBtn = document.getElementById('mic-btn');
    const waveform = document.getElementById('waveform');
    const status = document.getElementById('voice-status');

    if (!isRecording) {
        // Start recording
        const lang = Storage.getLanguage();
        SpeechEngine.init(lang);

        SpeechEngine.onResult = (result) => {
            const transcriptEl = document.getElementById('voice-transcript');
            const manualInput = document.getElementById('manual-input');
            if (transcriptEl) {
                transcriptEl.innerHTML = result.full || '<span style="color: var(--text-muted); font-style: italic;">Listening...</span>';
            }
            if (manualInput) {
                manualInput.value = result.final || '';
            }
        };

        SpeechEngine.onEnd = (finalText) => {
            if (isRecording) {
                // Auto-restart if user hasn't explicitly stopped
                try { SpeechEngine.recognition.start(); } catch (e) { }
                return;
            }
            stopRecordingUI();
        };

        SpeechEngine.onError = (error) => {
            if (error === 'not-allowed') {
                if (status) status.textContent = '⚠️ Microphone access denied';
                stopRecordingUI();
            }
        };

        const started = SpeechEngine.start();
        if (started) {
            isRecording = true;
            if (micBtn) micBtn.classList.add('recording');
            if (waveform) waveform.classList.add('active');
            if (status) status.textContent = '🔴 Listening... Speak now';
        } else {
            if (status) status.textContent = '⚠️ Could not start. Try again.';
        }
    } else {
        // Stop recording
        isRecording = false;
        SpeechEngine.stop();
        stopRecordingUI();
    }
}

function stopRecordingUI() {
    isRecording = false;
    const micBtn = document.getElementById('mic-btn');
    const waveform = document.getElementById('waveform');
    const status = document.getElementById('voice-status');

    if (micBtn) micBtn.classList.remove('recording');
    if (waveform) waveform.classList.remove('active');
    if (status) status.textContent = 'Tap to start listening';
}

function switchLang(lang) {
    Storage.setLanguage(lang);
    document.querySelectorAll('.lang-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.lang === lang);
    });

    if (isRecording) {
        SpeechEngine.setLanguage(lang);
    }
}

function clearVoiceInput() {
    const transcriptEl = document.getElementById('voice-transcript');
    const manualInput = document.getElementById('manual-input');

    if (transcriptEl) transcriptEl.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">Your words will appear here...</span>';
    if (manualInput) manualInput.value = '';

    SpeechEngine.reset();

    if (isRecording) {
        isRecording = false;
        SpeechEngine.stop();
        stopRecordingUI();
    }
}

async function analyzeSymptoms() {
    const manualInput = document.getElementById('manual-input');
    const inputText = manualInput?.value?.trim() || SpeechEngine.getTranscript();

    if (!inputText) {
        showToast('⚠️ Please describe your symptoms first');
        return;
    }

    // Stop recording if active
    if (isRecording) {
        isRecording = false;
        SpeechEngine.stop();
        stopRecordingUI();
    }

    // Initialize engines
    await SymptomEngine.init();
    await TriageEngine.init();

    // Extract symptoms
    const symptoms = SymptomEngine.extract(inputText);

    // Run triage
    const result = TriageEngine.evaluate(symptoms);

    // Save to history
    Storage.addHistory({
        symptoms: inputText.substring(0, 100),
        urgency: result.urgency,
        detectedSymptoms: symptoms,
        resultData: result
    });

    // Store results for display
    window._lastTriageResult = result;
    window._lastSymptoms = symptoms;
    window._lastInputText = inputText;

    // Navigate to results
    Router.navigate('/results');
}
