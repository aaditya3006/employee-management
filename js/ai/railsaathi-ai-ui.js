/**
 * RailSaathi AI Assistant UI Component
 * Builds and mounts the conversational AI assistant modal, speech controller, and form status indicators.
 */

(function () {
  'use strict';

  function initRailSaathiAIUI() {
    if (document.getElementById('rs-ai-modal-overlay')) return; // already initialized

    const ai = window.railSaathiAIInstance || new window.RailSaathiAI();
    window.railSaathiAIInstance = ai;

    // 1. Inject Header Action Bar above `#night-duty-date-row`
    injectFormHeaderBar(ai);

    // 2. Inject Floating Action Button (FAB)
    injectFloatingActionButton();

    // 3. Inject AI Assistant Modal
    injectAssistantModal(ai);

    // 4. Initial Sync with DOM
    ai.syncFromDOM();
    updateLiveStatusStrip(ai);

    // Listen to form input changes to update status strip
    document.addEventListener('input', (e) => {
      if (e.target && (e.target.id === 'fromDate' || e.target.id === 'toDate' || e.target.id.startsWith('emp-search-') || e.target.id.startsWith('emp-phone-'))) {
        ai.syncFromDOM();
        updateLiveStatusStrip(ai);
      }
    });

    console.log('🤖 RailSaathi AI Assistant UI successfully mounted');
  }

  // =========================================================================
  // 1. FORM HEADER BAR INJECTION
  // =========================================================================
  function injectFormHeaderBar(ai) {
    const legacyContainer = document.getElementById('legacy-containers');
    const dateRow = document.getElementById('night-duty-date-row');
    if (!legacyContainer || !dateRow) return;

    const bar = document.createElement('div');
    bar.id = 'ai-form-header-bar';
    bar.className = 'ai-form-header-bar no-print';
    bar.innerHTML = `
      <div class="ai-form-header-title">
        <span class="ai-header-sparkle">🤖</span>
        <div>
          <div style="font-size:14.5px; font-weight:700;">RailSaathi Voice & AI Assistant</div>
          <div style="font-size:11px; opacity:0.85; font-weight:500;">Speak or type naturally to automatically fill this duty roster</div>
        </div>
      </div>
      <div class="ai-form-header-actions">
        <button type="button" class="btn-ai-voice-quick" onclick="window.toggleRailSaathiAIVoice()" title="Speak to fill form">
          <span>🎙</span> Speak
        </button>
        <button type="button" class="btn-ai-trigger" onclick="window.openRailSaathiAIModal()" title="Open RailSaathi AI Assistant">
          <span>🤖</span> Fill with AI
        </button>
      </div>
    `;

    legacyContainer.insertBefore(bar, dateRow);
  }

  // =========================================================================
  // 2. FLOATING ACTION BUTTON (FAB)
  // =========================================================================
  function injectFloatingActionButton() {
    if (document.getElementById('ai-fab-container')) return;

    const fab = document.createElement('div');
    fab.id = 'ai-fab-container';
    fab.className = 'ai-fab-container no-print';
    fab.innerHTML = `
      <button type="button" class="ai-fab-btn" onclick="window.openRailSaathiAIModal()" aria-label="Open RailSaathi AI Assistant" title="RailSaathi AI Assistant">
        <span class="ai-fab-icon">🎙</span>
        <span>AI Assistant</span>
      </button>
    `;
    document.body.appendChild(fab);
  }

  // =========================================================================
  // 3. ASSISTANT MODAL & BOTTOM SHEET
  // =========================================================================
  function injectAssistantModal(ai) {
    const overlay = document.createElement('div');
    overlay.id = 'rs-ai-modal-overlay';
    overlay.className = 'rs-ai-modal-overlay no-print';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'RailSaathi AI Assistant');

    overlay.innerHTML = `
      <div class="rs-ai-modal-card">
        <!-- Header -->
        <div class="rs-ai-modal-header">
          <div class="rs-ai-modal-header-left">
            <div class="rs-ai-logo-box">🚂</div>
            <div class="rs-ai-header-text">
              <h3>RailSaathi AI Assistant <span class="rs-ai-status-dot"></span></h3>
              <p>Natural Language & Voice Duty Form Automation</p>
            </div>
          </div>
          <button type="button" class="rs-ai-modal-close" onclick="window.closeRailSaathiAIModal()" aria-label="Close Assistant">✕</button>
        </div>

        <!-- Dynamic Form Status Indicator -->
        <div class="rs-ai-status-strip" id="rs-ai-status-strip">
          <span class="rs-ai-status-title">Form Status:</span>
          <span class="rs-ai-status-badge" id="status-badge-from">○ From Date</span>
          <span class="rs-ai-status-badge" id="status-badge-to">○ To Date</span>
          <span class="rs-ai-status-badge" id="status-badge-bit1">○ BIT 1</span>
          <span class="rs-ai-status-badge" id="status-badge-bit2">○ BIT 2</span>
          <span class="rs-ai-status-badge" id="status-badge-bit3">○ BIT 3</span>
          <span class="rs-ai-status-badge" id="status-badge-bit4">○ BIT 4</span>
          <span class="rs-ai-status-badge" id="status-badge-bit5">○ BIT 5</span>
          <span class="rs-ai-status-badge" id="status-badge-bit6">○ BIT 6</span>
        </div>

        <!-- Chat Transcript Body -->
        <div class="rs-ai-chat-body" id="rs-ai-chat-body">
          <div class="rs-ai-message bot">
            <div class="rs-ai-msg-avatar">🤖</div>
            <div class="rs-ai-msg-bubble">
              <p><strong>Namaste! I am your RailSaathi AI Assistant.</strong></p>
              <p>You can speak or type to fill the roster form in one go or step by step.</p>
              <p style="font-size:12px; color:#64748b; margin-top:6px;"><strong>Examples:</strong><br>
              • <em>"From 24 September to 26 September, assign Ramesh Kumar to BIT 1, mobile 9876543210"</em><br>
              • <em>"Assign Suresh Kumar to BIT 2"</em><br>
              • <em>"Change BIT 2 mobile to 9876543215"</em><br>
              • <em>"Clear BIT 4"</em><br>
              • <em>"Generate preview"</em></p>
            </div>
          </div>
        </div>

        <!-- Quick Action Suggestion Chips -->
        <div class="rs-ai-quick-chips">
          <button type="button" class="rs-ai-chip" onclick="window.handleQuickChip('From 24 September to 26 September')">📅 24 to 26 Sep</button>
          <button type="button" class="rs-ai-chip" onclick="window.handleQuickChip('Assign Ramesh Kumar to BIT 1, mobile 9876543210')">👤 Ramesh to BIT 1</button>
          <button type="button" class="rs-ai-chip" onclick="window.handleQuickChip('Assign Suresh Kumar to BIT 2, mobile 9876543211')">👤 Suresh to BIT 2</button>
          <button type="button" class="rs-ai-chip" onclick="window.handleQuickChip('Fill BIT 1 to 6 with available personnel')">⚡ Fill BIT 1 to 6</button>
          <button type="button" class="rs-ai-chip" onclick="window.handleQuickChip('Generate preview')">📄 Generate Preview</button>
        </div>

        <!-- Active Voice Waveform Indicator -->
        <div class="rs-ai-voice-active-bar" id="rs-ai-voice-bar">
          <div class="rs-ai-wave-bars">
            <div class="rs-ai-wave-bar"></div>
            <div class="rs-ai-wave-bar"></div>
            <div class="rs-ai-wave-bar"></div>
            <div class="rs-ai-wave-bar"></div>
            <div class="rs-ai-wave-bar"></div>
          </div>
          <span id="rs-ai-voice-text">Listening... Speak your command now</span>
        </div>

        <!-- Bottom Input Bar -->
        <div class="rs-ai-input-area">
          <button type="button" class="rs-ai-mic-btn" id="rs-ai-mic-btn" onclick="window.toggleRailSaathiAIVoice()" title="Voice Input" aria-label="Toggle Voice Input">
            🎙
          </button>
          <input type="text" id="rs-ai-text-input" class="rs-ai-text-input" placeholder="Type or speak (e.g. 'From 24 to 26 Sep, assign Ramesh to BIT 1')..." autocomplete="off">
          <button type="button" class="rs-ai-send-btn" id="rs-ai-send-btn" onclick="window.submitRailSaathiAIInput()" title="Send Command" aria-label="Send Command">
            ➤
          </button>
          <button type="button" class="rs-ai-undo-btn" onclick="window.handleRailSaathiAIUndo()" title="Undo last form action">
            ↶ Undo
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listener for enter key
    const textInput = overlay.querySelector('#rs-ai-text-input');
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.submitRailSaathiAIInput();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        window.closeRailSaathiAIModal();
      }
    });

    // Close on overlay backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        window.closeRailSaathiAIModal();
      }
    });

    // Subscribe to AI instance events
    ai.subscribe((eventType, data) => {
      if (eventType === 'SPEECH_START') {
        const mic = document.getElementById('rs-ai-mic-btn');
        const voiceBar = document.getElementById('rs-ai-voice-bar');
        if (mic) mic.classList.add('listening');
        if (voiceBar) voiceBar.classList.add('active');
      } else if (eventType === 'SPEECH_END' || eventType === 'SPEECH_ERROR') {
        const mic = document.getElementById('rs-ai-mic-btn');
        const voiceBar = document.getElementById('rs-ai-voice-bar');
        if (mic) mic.classList.remove('listening');
        if (voiceBar) voiceBar.classList.remove('active');
      } else if (eventType === 'SPEECH_RESULT') {
        if (data) {
          appendUserMessage(data);
          processAndDisplayAIResponse(ai, data);
        }
      }
      updateLiveStatusStrip(ai);
    });
  }

  // =========================================================================
  // 4. UI CONTROLLER ACTIONS
  // =========================================================================
  window.openRailSaathiAIModal = function () {
    const overlay = document.getElementById('rs-ai-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      const input = document.getElementById('rs-ai-text-input');
      if (input) setTimeout(() => input.focus(), 150);
      if (window.railSaathiAIInstance) {
        window.railSaathiAIInstance.syncFromDOM();
        updateLiveStatusStrip(window.railSaathiAIInstance);
      }
    }
  };

  window.closeRailSaathiAIModal = function () {
    const overlay = document.getElementById('rs-ai-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    if (window.railSaathiAIInstance) window.railSaathiAIInstance.stopListening();
  };

  window.toggleRailSaathiAIVoice = function () {
    const ai = window.railSaathiAIInstance;
    if (!ai) return;

    window.openRailSaathiAIModal();

    if (ai.isListening) {
      ai.stopListening();
    } else {
      const started = ai.startListening(
        (transcript) => {
          // Handled via subscription
        },
        (errorMsg) => {
          appendBotMessage(`⚠️ ${errorMsg}`);
        }
      );
      if (!started) {
        appendBotMessage('⚠️ Voice recognition could not be started. You can type instructions in the box below.');
      }
    }
  };

  window.submitRailSaathiAIInput = function () {
    const inputEl = document.getElementById('rs-ai-text-input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    appendUserMessage(text);
    processAndDisplayAIResponse(window.railSaathiAIInstance, text);
  };

  window.handleQuickChip = function (promptText) {
    appendUserMessage(promptText);
    processAndDisplayAIResponse(window.railSaathiAIInstance, promptText);
  };

  window.handleCandidateSelection = function (candidateName) {
    appendUserMessage(candidateName);
    processAndDisplayAIResponse(window.railSaathiAIInstance, candidateName);
  };

  window.handleRailSaathiAIUndo = function () {
    const ai = window.railSaathiAIInstance;
    if (!ai) return;
    const res = ai.undo();
    appendBotMessage(res.message);
    updateLiveStatusStrip(ai);
  };

  function processAndDisplayAIResponse(ai, text) {
    if (!ai) return;

    const res = ai.processInput(text);

    let htmlContent = formatMarkdownSimple(res.message);

    // If ambiguous candidates are present, append interactive candidate buttons
    if (res.action === 'SELECT_PERSONNEL' && Array.isArray(res.candidates)) {
      htmlContent += `<div class="rs-ai-candidate-list">`;
      res.candidates.forEach(c => {
        htmlContent += `<button type="button" class="rs-ai-candidate-btn" onclick="window.handleCandidateSelection('${c.name.replace(/'/g, "\\'")}')">👤 ${c.name} (${c.phone || 'No phone'})</button>`;
      });
      htmlContent += `</div>`;
    }

    appendBotMessage(htmlContent, true);
    updateLiveStatusStrip(ai);

    // If preview generated, close modal after short moment so user sees preview table
    if (res.action === 'PREVIEW_GENERATED') {
      setTimeout(() => {
        window.closeRailSaathiAIModal();
      }, 900);
    }
  }

  function appendUserMessage(text) {
    const body = document.getElementById('rs-ai-chat-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'rs-ai-message user';
    div.innerHTML = `
      <div class="rs-ai-msg-avatar">👤</div>
      <div class="rs-ai-msg-bubble">${escapeHtml(text)}</div>
    `;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function appendBotMessage(content, isHtml = false) {
    const body = document.getElementById('rs-ai-chat-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'rs-ai-message bot';
    div.innerHTML = `
      <div class="rs-ai-msg-avatar">🤖</div>
      <div class="rs-ai-msg-bubble">${isHtml ? content : formatMarkdownSimple(content)}</div>
    `;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function updateLiveStatusStrip(ai) {
    if (!ai) return;
    const status = ai.getFormStatus();

    const fromBadge = document.getElementById('status-badge-from');
    const toBadge = document.getElementById('status-badge-to');
    if (fromBadge) {
      fromBadge.className = `rs-ai-status-badge ${status.fromDate ? 'complete' : ''}`;
      fromBadge.innerHTML = status.fromDate ? `✓ From: ${ai.formatDisplayDate(ai.state.fromDate)}` : `○ From Date`;
    }
    if (toBadge) {
      toBadge.className = `rs-ai-status-badge ${status.toDate ? 'complete' : ''}`;
      toBadge.innerHTML = status.toDate ? `✓ To: ${ai.formatDisplayDate(ai.state.toDate)}` : `○ To Date`;
    }

    for (let i = 1; i <= 6; i++) {
      const bitBadge = document.getElementById(`status-badge-bit${i}`);
      if (bitBadge) {
        const bitStat = status.bits[i];
        if (bitStat === 'COMPLETE') {
          bitBadge.className = 'rs-ai-status-badge complete';
          bitBadge.innerHTML = `✓ BIT ${i}`;
        } else if (bitStat === 'INCOMPLETE') {
          bitBadge.className = 'rs-ai-status-badge incomplete';
          bitBadge.innerHTML = `⚠ BIT ${i} (no mobile)`;
        } else {
          bitBadge.className = 'rs-ai-status-badge';
          bitBadge.innerHTML = `○ BIT ${i}`;
        }
      }
    }
  }

  function escapeHtml(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  function formatMarkdownSimple(text) {
    if (!text) return '';
    let formatted = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet points • or -
    formatted = formatted.replace(/(?:^|\n)[•\-]\s+(.*?)(?=\n|$)/g, '<br>• $1');
    // Newlines
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  // Self-initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRailSaathiAIUI);
  } else {
    initRailSaathiAIUI();
  }

})();
