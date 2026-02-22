/* ===== Voice Input Page ===== */
function renderVoice() {
  const page = document.createElement('div');
  page.className = 'page voice-page page-scroll';

  const speechSupported = SpeechEngine.isSupported();
  const currentLang = Storage.getLanguage();

  // Languages supported
  const LANGS = [
    { code: 'en-IN', label: 'English' },
    { code: 'hi-IN', label: 'हिन्दी' },
    { code: 'ta-IN', label: 'தமிழ்' },
    { code: 'te-IN', label: 'తెలుగు' },
    { code: 'bn-IN', label: 'বাংলা' },
  ];

  page.innerHTML = `
    <div class="voice-header">
      <h2>Describe Symptoms</h2>
      <p>${speechSupported ? 'Tap the mic and speak clearly in your language' : 'Speech recognition unavailable — type below'}</p>
      ${speechSupported ? `
        <div class="voice-lang-selector" style="flex-wrap:wrap;">
          ${LANGS.map(l => `
            <button class="lang-chip ${currentLang === l.code ? 'active' : ''}" 
                    data-lang="${l.code}" 
                    onclick="switchLang('${l.code}')">${l.label}</button>
          `).join('')}
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
        
        <div class="voice-status" id="voice-status">TAP TO START LISTENING</div>
        
        <!-- Confidence indicator -->
        <div id="confidence-bar-wrap" style="display:none; width:100%; margin-top: -8px;">
          <div style="
            height:3px; 
            background: rgba(255,255,255,0.08); 
            border-radius:999px; 
            overflow:hidden;
          ">
            <div id="confidence-bar" style="
              height:100%; 
              width:0%; 
              background: linear-gradient(90deg, var(--color-emergency), var(--color-urgent), var(--accent-teal));
              border-radius:999px;
              transition: width 0.3s ease;
            "></div>
          </div>
          <div id="confidence-label" style="
            font-family: var(--font-display); 
            font-size:9px; 
            letter-spacing:0.1em; 
            color: var(--text-muted);
            text-align:right;
            margin-top:3px;
          ">SIGNAL QUALITY: —</div>
        </div>
        
        <div class="voice-transcript" id="voice-transcript">
          <span style="color: var(--text-muted); font-style: italic;">Your words will appear here...</span>
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
        placeholder="Or type symptoms here… e.g., 'I have chest pain and difficulty breathing' / 'seene mein dard aur saans lene mein takleef'"
        rows="3"
      ></textarea>

      <!-- Quick symptom chips for fast selection -->
      <div style="margin-top: var(--space-md);">
        <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.12em; color:var(--text-muted); text-transform:uppercase; margin-bottom:var(--space-sm);">Quick Select</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${['Chest Pain', 'Difficulty Breathing', 'Unconscious', 'Severe Bleeding', 'Seizure', 'High Fever', 'Snake Bite', 'Head Injury'].map(s => `
            <button class="lang-chip" onclick="addQuickSymptom('${s}')" style="font-size:11px; padding:4px 10px;">${s}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="voice-actions">
      <button class="btn btn-ghost btn-block" onclick="clearVoiceInput()" id="clear-voice-btn">
        🗑 Clear
      </button>
      <button class="btn btn-primary btn-block btn-lg" onclick="analyzeSymptoms()" id="analyze-btn">
        ⬡ Analyze
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
  const confWrap = document.getElementById('confidence-bar-wrap');

  if (!isRecording) {
    const lang = Storage.getLanguage();
    SpeechEngine.init(lang);

    SpeechEngine.onResult = (result) => {
      const transcriptEl = document.getElementById('voice-transcript');
      const manualInput = document.getElementById('manual-input');
      const confBar = document.getElementById('confidence-bar');
      const confLabel = document.getElementById('confidence-label');

      if (transcriptEl) {
        transcriptEl.innerHTML = result.full || '<span style="color:var(--text-muted);font-style:italic;">Listening...</span>';
      }
      if (manualInput) manualInput.value = result.final || '';

      // Confidence signal: estimate by text length
      const quality = Math.min(100, Math.max(10, result.full.length * 1.5));
      if (confBar) confBar.style.width = quality + '%';
      const label = quality > 70 ? 'GOOD' : quality > 40 ? 'MODERATE' : 'WEAK';
      if (confLabel) confLabel.textContent = `SIGNAL QUALITY: ${label}`;
    };

    SpeechEngine.onEnd = () => {
      if (isRecording) {
        try { SpeechEngine.recognition.start(); } catch (e) { }
        return;
      }
      stopRecordingUI();
    };

    SpeechEngine.onError = (error) => {
      if (error === 'not-allowed') {
        if (status) status.textContent = '⚠ Microphone access denied';
        stopRecordingUI();
      }
    };

    const started = SpeechEngine.start();
    if (started) {
      isRecording = true;
      if (micBtn) micBtn.classList.add('recording');
      if (waveform) waveform.classList.add('active');
      if (status) status.textContent = '● LISTENING — SPEAK NOW';
      if (confWrap) confWrap.style.display = 'block';
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      if (status) status.textContent = '⚠ Could not start. Try again.';
    }
  } else {
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
  if (status) status.textContent = 'TAP TO START LISTENING';
}

function switchLang(lang) {
  Storage.setLanguage(lang);
  document.querySelectorAll('.lang-chip[data-lang]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.lang === lang);
  });
  if (isRecording) SpeechEngine.setLanguage(lang);
}

// Quick symptom chip tap
function addQuickSymptom(symptom) {
  const input = document.getElementById('manual-input');
  if (!input) return;
  const existing = input.value.trim();
  input.value = existing ? `${existing}, ${symptom}` : symptom;
  input.style.borderColor = 'var(--accent-primary)';
  setTimeout(() => input.style.borderColor = '', 600);
  if (navigator.vibrate) navigator.vibrate(30);
}

function clearVoiceInput() {
  const transcriptEl = document.getElementById('voice-transcript');
  const manualInput = document.getElementById('manual-input');
  const confWrap = document.getElementById('confidence-bar-wrap');

  if (transcriptEl) transcriptEl.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">Your words will appear here...</span>';
  if (manualInput) manualInput.value = '';
  if (confWrap) confWrap.style.display = 'none';

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
    showToast('⚠ Please describe your symptoms first');
    return;
  }

  if (isRecording) {
    isRecording = false;
    SpeechEngine.stop();
    stopRecordingUI();
  }

  // Show loading state on button
  const btn = document.getElementById('analyze-btn');
  if (btn) { btn.textContent = '⏳ Analyzing...'; btn.disabled = true; }

  await SymptomEngine.init();
  await TriageEngine.init();

  const symptoms = SymptomEngine.extract(inputText);
  const result = TriageEngine.evaluate(symptoms);

  // Track stats
  if (!navigator.onLine || localStorage.getItem('upline_forced_offline') === 'true') {
    Storage.incrementStat('offlineUses');
  }

  Storage.addHistory({
    symptoms: inputText.substring(0, 100),
    urgency: result.urgency,
    detectedSymptoms: symptoms,
    resultData: result
  });

  window._lastTriageResult = result;
  window._lastSymptoms = symptoms;
  window._lastInputText = inputText;

  Router.navigate('/results');
}
