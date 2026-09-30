import { ServiceLocator } from '@app/engine/core/service-locator';
import { KeepTrackPlugin } from '@app/engine/plugins/base-plugin';
import { IKeyboardShortcut, IKeyboardShortcutCapable } from '@app/engine/plugins/core/plugin-capabilities';
import { getEl } from '@app/engine/utils/get-el';
import { RAGEngine } from './rag-engine';
import { VoiceAssistant } from './voice-assistant';
import './rag-ai-assistant.css';

export class RagAiAssistant extends KeepTrackPlugin implements IKeyboardShortcutCapable {
  readonly id = 'RagAiAssistant';
  dependencies_ = [];

  private ragEngine: RAGEngine;
  private voiceAssistant: VoiceAssistant;
  private isOpen = false;
  private isVoiceAssistantActive = false;
  private chatHistory: { sender: 'bot' | 'user'; text: string }[] = [];
  private lastProcessedVoiceQuery = '';
  private bubbleTimeout: any = null;

  constructor() {
    super();
    this.ragEngine = new RAGEngine();
    this.voiceAssistant = new VoiceAssistant();
  }

  addHtml(): void {
    super.addHtml();

    if (getEl('rag-chatbot-fab')) {
      return;
    }

    // 1. Create Compact Left Side Corner Voice Assistant Widget
    const voiceWidgetLeft = document.createElement('div');
    voiceWidgetLeft.id = 'rag-voice-widget-left';
    voiceWidgetLeft.className = 'rag-voice-widget-left';
    voiceWidgetLeft.innerHTML = `
      <span class="rag-voice-mic-icon">🎙️</span>
      <span class="rag-voice-label">Voice Assistant</span>
      <label class="rag-voice-switch" title="Toggle Voice Assistant ON / OFF">
        <input type="checkbox" id="rag-voice-toggle-switch" />
        <span class="rag-voice-slider"></span>
      </label>
      <div id="rag-voice-listening-indicator" class="rag-voice-listening-indicator" style="display: none;">
        <span class="rag-pulse-dot"></span> Listening...
      </div>
      <div id="rag-voice-bubble" class="rag-voice-bubble" style="display: none;"></div>
    `;

    // 2. Create Floating Action Button (FAB) at Bottom-Right Corner
    const fab = document.createElement('button');
    fab.id = 'rag-chatbot-fab';
    fab.type = 'button';
    fab.title = 'Open RAG AI & Voice Assistant (Alt+A)';
    fab.innerHTML = `
      <span class="fab-icon">🤖</span>
      <span class="fab-badge"></span>
    `;

    // 3. Create Main Chatbot Window Container
    const container = document.createElement('div');
    container.id = 'rag-chatbot-container';
    container.innerHTML = `
      <!-- Header -->
      <div class="rag-chat-header">
        <div class="rag-header-info">
          <div class="rag-bot-avatar">🤖</div>
          <div class="rag-header-text">
            <h3>ALT + F4 RAG AI</h3>
            <p><span class="rag-status-dot"></span> Full Knowledge Engine • Voice Ready</p>
          </div>
        </div>
        <div class="rag-header-actions">
          <button type="button" id="rag-key-btn" class="rag-icon-btn" title="Set OpenAI ChatGPT API Key">🔑</button>
          <button type="button" id="rag-tts-toggle-btn" class="rag-icon-btn active" title="Toggle Text-to-Speech Voice Output">🔊</button>
          <button type="button" id="rag-clear-btn" class="rag-icon-btn" title="Clear Chat History">🗑️</button>
          <button type="button" id="rag-close-btn" class="rag-icon-btn" title="Close (Esc or Alt+A)">✕</button>
        </div>
      </div>

      <!-- Optional API Key Settings Bar -->
      <div id="rag-key-bar" class="rag-key-bar" style="display: none;">
        <input type="password" id="rag-key-input" class="rag-key-input" placeholder="Paste OpenAI API Key (sk-...)" autocomplete="off" />
        <button type="button" id="rag-key-save-btn" class="rag-key-save-btn">Save</button>
      </div>

      <!-- Chat Body Stream -->
      <div id="rag-chat-body" class="rag-chat-body"></div>

      <!-- Voice Status Banner -->
      <div id="rag-voice-banner" class="rag-voice-status" style="display: none;">
        <span>🎙️ Listening to your voice... Speak now!</span>
        <div class="rag-voice-waves">
          <div class="rag-voice-wave"></div>
          <div class="rag-voice-wave"></div>
          <div class="rag-voice-wave"></div>
          <div class="rag-voice-wave"></div>
        </div>
      </div>

      <!-- Quick Suggestion Chips -->
      <div id="rag-chips-container" class="rag-suggestions"></div>

      <!-- Input Footer Form -->
      <form id="rag-chat-form" class="rag-chat-footer" action="javascript:void(0);">
        <div class="rag-input-wrapper">
          <input type="text" id="rag-chat-input" class="rag-chat-input" placeholder="Ask anything about ALT + F4 or satellites..." autocomplete="off" spellcheck="false" />
          <button type="button" id="rag-mic-btn" class="rag-mic-btn" title="Voice Input (Click & Speak)">🎤</button>
        </div>
        <button type="submit" id="rag-send-btn" class="rag-send-btn" title="Send Question">➤</button>
      </form>
    `;

    document.body.appendChild(voiceWidgetLeft);
    document.body.appendChild(fab);
    document.body.appendChild(container);

    this.bindEvents();
    this.sendInitialGreeting();
  }

  private bindEvents(): void {
    const fab = getEl('rag-chatbot-fab');
    const container = getEl('rag-chatbot-container');
    const voiceWidgetLeft = getEl('rag-voice-widget-left');
    const voiceToggleSwitch = getEl('rag-voice-toggle-switch') as HTMLInputElement;
    const closeBtn = getEl('rag-close-btn');
    const clearBtn = getEl('rag-clear-btn');
    const ttsBtn = getEl('rag-tts-toggle-btn');
    const keyBtn = getEl('rag-key-btn');
    const keyBar = getEl('rag-key-bar');
    const keyInput = getEl('rag-key-input') as HTMLInputElement;
    const keySaveBtn = getEl('rag-key-save-btn');
    const formEl = getEl('rag-chat-form') as HTMLFormElement;
    const micBtn = getEl('rag-mic-btn');
    const inputEl = getEl('rag-chat-input') as HTMLInputElement;

    const isolateEvent = (e: Event) => {
      e.stopPropagation();
    };

    ['keydown', 'keyup', 'keypress', 'input', 'change'].forEach((evt) => {
      container?.addEventListener(evt, isolateEvent);
      inputEl?.addEventListener(evt, isolateEvent);
      keyInput?.addEventListener(evt, isolateEvent);
    });

    ['mousedown', 'mouseup', 'click', 'dblclick', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((evt) => {
      container?.addEventListener(evt, isolateEvent);
      voiceWidgetLeft?.addEventListener(evt, isolateEvent);
      fab?.addEventListener(evt, isolateEvent);
      inputEl?.addEventListener(evt, isolateEvent);
      keyInput?.addEventListener(evt, isolateEvent);
    });

    // Handle Left Corner Voice Assistant Toggle Switch ON / OFF
    voiceToggleSwitch?.addEventListener('change', () => {
      if (voiceToggleSwitch.checked) {
        this.turnOnVoiceAssistant();
      } else {
        this.turnOffVoiceAssistant();
      }
    });

    fab?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleChat();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeChat();
    });

    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearChat();
    });

    ttsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const enabled = this.voiceAssistant.toggleTts();
      ttsBtn.classList.toggle('active', enabled);
      ttsBtn.title = enabled ? 'Voice Output ENABLED' : 'Voice Output DISABLED';
    });

    // Toggle API Key Settings Bar
    keyBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!keyBar) return;
      const isVisible = keyBar.style.display !== 'none';
      keyBar.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible && keyInput) {
        keyInput.value = this.ragEngine.getApiKey() || '';
        setTimeout(() => keyInput.focus(), 100);
      }
      keyBtn.classList.toggle('active', !isVisible);
    });

    keySaveBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (keyInput) {
        const keyVal = keyInput.value.trim();
        this.ragEngine.setApiKey(keyVal);
        if (keyBar) keyBar.style.display = 'none';
        keyBtn?.classList.toggle('active', Boolean(keyVal));
        this.appendBotMessage(
          keyVal
            ? '🔑 **ChatGPT API Key saved!** All questions will now be answered live by ChatGPT with ALT + F4 project training data.'
            : '🔒 **ChatGPT API Key removed.** Returning to offline local RAG Knowledge Engine.'
        );
      }
    });

    formEl?.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleFormSubmit();
    });

    micBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVoiceInput();
    });

    // Close on Escape key if open
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });
  }

  /**
   * Turn ON Left Corner Voice Assistant
   */
  private turnOnVoiceAssistant(): void {
    this.isVoiceAssistantActive = true;
    this.voiceAssistant.setTtsEnabled(true);

    const welcomeMsg = 'Voice Assistant active. Ask a question or command.';
    this.showVoiceBubble(welcomeMsg);

    this.voiceAssistant.speak(welcomeMsg, () => {
      this.startContinuousVoiceListening();
    });
  }

  /**
   * Turn OFF Left Corner Voice Assistant (COMPLETELY SILENT)
   */
  private turnOffVoiceAssistant(): void {
    this.isVoiceAssistantActive = false;
    if (this.bubbleTimeout) {
      clearTimeout(this.bubbleTimeout);
      this.bubbleTimeout = null;
    }
    this.voiceAssistant.stopSpeaking();
    this.voiceAssistant.setTtsEnabled(false);
    this.voiceAssistant.stopListening();

    const bubble = getEl('rag-voice-bubble');
    if (bubble) {
      bubble.textContent = '';
      bubble.style.display = 'none';
    }

    const indicator = getEl('rag-voice-listening-indicator');
    if (indicator) {
      indicator.textContent = '';
      indicator.style.display = 'none';
    }
  }

  private showVoiceBubble(text: string): void {
    if (!this.isVoiceAssistantActive) {
      return;
    }

    const bubble = getEl('rag-voice-bubble');
    if (!bubble) return;

    if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);

    // Strip markdown formatting for clean, concise text display
    const clean = text
      .replace(/[\#\*\_\`\-\>] /g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    const shortText = clean.length > 140 ? `${clean.slice(0, 137)}...` : clean;

    bubble.textContent = shortText;
    bubble.style.display = 'block';

    this.bubbleTimeout = setTimeout(() => {
      if (bubble && this.isVoiceAssistantActive) {
        bubble.style.display = 'none';
      }
    }, 6000);
  }

  private startContinuousVoiceListening(): void {
    if (!this.isVoiceAssistantActive) return;

    const indicator = getEl('rag-voice-listening-indicator');

    this.voiceAssistant.startListening(
      (transcript, isFinal) => {
        const input = getEl('rag-chat-input') as HTMLInputElement;
        if (input) {
          input.value = transcript;
        }

        if (indicator && this.isVoiceAssistantActive) {
          indicator.style.display = 'flex';
          const cleanText = transcript.trim();
          indicator.innerHTML = `<span class="rag-pulse-dot"></span> ${
            cleanText.length > 22 ? cleanText.slice(-22) : cleanText || 'Listening...'
          }`;
        }

        if (isFinal && transcript.trim().length > 1 && transcript.trim() !== this.lastProcessedVoiceQuery) {
          this.lastProcessedVoiceQuery = transcript.trim();
          this.handleVoiceQuery(transcript.trim());
        }
      },
      (isListening) => {
        const micBtn = getEl('rag-mic-btn');
        micBtn?.classList.toggle('listening', isListening);

        if (indicator) {
          indicator.style.display = isListening && this.isVoiceAssistantActive ? 'flex' : 'none';
          if (isListening) {
            indicator.innerHTML = `<span class="rag-pulse-dot"></span> Listening...`;
          }
        }
      },
      (errMsg) => {
        console.warn(errMsg);
      }
    );
  }

  private handleVoiceQuery(userQuery: string): void {
    const input = getEl('rag-chat-input') as HTMLInputElement;
    if (input) input.value = '';

    // Check for app navigation and command triggers
    const executedCmd = this.executeVoiceAppCommand(userQuery);

    if (executedCmd) {
      const confirmMsg = `⚡ Navigated to ${executedCmd}`;
      this.showVoiceBubble(confirmMsg);
      if (this.isVoiceAssistantActive && this.voiceAssistant.isTtsEnabled()) {
        this.voiceAssistant.speak(`Opening ${executedCmd}.`);
      }
    } else {
      this.sendMessageText(userQuery);
    }
  }

  private createSpokenUtterance(text: string): string {
    let clean = text
      .replace(/^#+\s*/gm, '')
      .replace(/[\#\*\_\`\-\>] /g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    const firstSentenceMatch = clean.match(/^.*?[.!?](?:\s|$)/);
    let spoken = firstSentenceMatch ? firstSentenceMatch[0].trim() : clean;

    const words = spoken.split(/\s+/);
    if (words.length > 12) {
      spoken = words.slice(0, 12).join(' ') + '.';
    }

    return spoken;
  }

  /**
   * Evaluates and executes live app commands & navigation by voice
   */
  private executeVoiceAppCommand(query: string): string | null {
    const rawLower = query.toLowerCase().trim();

    // Strip common conversational filler words for natural language navigation
    const cleanLower = rawLower
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\b(can you|could you|please|i want to|i would like to|navigate to|take me to|go to|open up|open|show me|show|switch to|bring up|launch|toggle)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const textToMatch = `${rawLower} ${cleanLower}`;

    // Direct Target Search Ingestion (e.g., "search ISS", "find Hubble")
    const searchMatch = query.match(/(?:search|find|locate|lookup)\s+(?:for\s+)?([a-z0-9\s\-]+)/i);
    if (searchMatch && searchMatch[1]) {
      const targetQuery = searchMatch[1].trim();
      const lowerTarget = targetQuery.toLowerCase();
      if (targetQuery.length >= 2 && !['satellite', 'satellites', 'page', 'tool', 'menu', 'anything', 'here'].includes(lowerTarget)) {
        this.triggerKeepTrackNavigation('menu-find-sat', ['#search-input', '#search-btn', '#btn-find-sat', '.menu-search', '#top-menu-search', '[data-plugin-id="find-sat"]']);
        const searchInput = (getEl('search-input') || document.querySelector('#search-input')) as HTMLInputElement;
        if (searchInput) {
          searchInput.value = targetQuery;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return `Satellite "${targetQuery}"`;
      }
    }

    // 1. Satellite Search Dialog
    if (textToMatch.includes('search') || textToMatch.includes('find sat') || textToMatch.includes('lookup') || textToMatch.includes('find satellite')) {
      this.triggerKeepTrackNavigation(['find-satellite-bottom-icon', 'menu-find-sat', 'search-menu-icon'], ['#search-btn', '#search-input', '#btn-find-sat', '.menu-search', '#top-menu-search', '[data-plugin-id="find-sat"]'], 'findByLooks-menu');
      return 'Satellite Search';
    }

    // 2. Breakup & Collision Simulator
    if (textToMatch.includes('breakup') || textToMatch.includes('collision') || textToMatch.includes('explosion') || textToMatch.includes('debris cloud') || textToMatch.includes('impact')) {
      this.triggerKeepTrackNavigation(['breakup-bottom-icon', 'menu-breakup', 'breakup-menu-icon'], ['#top-menu-breakup-li', '#btn-breakup', '.menu-breakup', '[data-plugin-id="breakup"]'], 'breakup-menu');
      return 'Breakup Tool';
    }

    // 3. Custom Satellite Builder
    if (textToMatch.includes('create sat') || textToMatch.includes('custom sat') || textToMatch.includes('add sat') || textToMatch.includes('orbit builder') || textToMatch.includes('build sat')) {
      this.triggerKeepTrackNavigation(['create-sat-bottom-icon', 'menu-create-sat', 'create-sat-menu-icon'], ['#top-menu-create-sat', '#btn-create-sat', '.menu-create-sat', '[data-plugin-id="create-sat"]'], 'create-sat-menu');
      return 'Custom Sat Builder';
    }

    // 4. Solar System & Planets View
    if (textToMatch.includes('planet') || textToMatch.includes('solar system') || textToMatch.includes('mars') || textToMatch.includes('jupiter') || textToMatch.includes('sun view') || textToMatch.includes('earth view')) {
      this.triggerKeepTrackNavigation(['planets-menu-bottom-icon', 'planets-bottom-icon', 'menu-planets', 'planets-menu-icon'], ['#top-menu-planets-li', '#btn-planets', '.menu-planets', '[data-plugin-id="planets"]'], 'planets-menu');
      return 'Solar System View';
    }

    // 5. Settings Menu
    if (textToMatch.includes('setting') || textToMatch.includes('preference') || textToMatch.includes('config') || textToMatch.includes('option')) {
      this.triggerKeepTrackNavigation(['settings-menu-icon', 'settings-bottom-icon', 'menu-settings'], ['#menu-settings', '#top-menu-settings', '#btn-settings', '.menu-settings', '[data-plugin-id="settings"]'], 'settings-menu');
      return 'Settings Menu';
    }

    // 6. Filter & Constellations Menu
    if (textToMatch.includes('filter') || textToMatch.includes('constellation') || textToMatch.includes('starlink') || textToMatch.includes('gps') || textToMatch.includes('group')) {
      this.triggerKeepTrackNavigation(['sat-constellations-bottom-icon', 'filter-menu-icon', 'menu-filter'], ['#menu-filter', '#top-menu-filter', '#btn-filter', '.menu-filter', '[data-plugin-id="filter"]'], 'filter-menu');
      return 'Filter Menu';
    }

    // 7. Plugin Drawer / Left Menu
    if (textToMatch.includes('drawer') || textToMatch.includes('plugin drawer') || textToMatch.includes('left menu') || textToMatch.includes('sidebar') || textToMatch.includes('tools menu')) {
      this.triggerKeepTrackNavigation(['plugin-manager-bottom-icon', 'menu-drawer', 'left-menu-btn'], ['#left-menu-btn', '#btn-drawer', '#left-menu-icon', '.drawer-item'], 'plugin-manager-menu');
      return 'Plugin Drawer';
    }

    // 8. Sensors & Radar Coverage FOV
    if (textToMatch.includes('sensor') || textToMatch.includes('radar') || textToMatch.includes('fov') || textToMatch.includes('coverage') || textToMatch.includes('ground station') || textToMatch.includes('telescope')) {
      this.triggerKeepTrackNavigation(['sensor-fov-bottom-icon', 'sensor-list-bottom-icon', 'menu-sensor'], ['#menu-sensor', '#btn-sensor', '#top-menu-sensor', '[data-plugin-id="sensor"]', '.menu-sensor'], 'sensor-fov-menu');
      return 'Sensors & Radar FOV';
    }

    // 9. Watchlist & Favorites
    if (textToMatch.includes('watchlist') || textToMatch.includes('favorite') || textToMatch.includes('watch list') || textToMatch.includes('saved sat') || textToMatch.includes('bookmark')) {
      this.triggerKeepTrackNavigation(['watchlist-filter-icon', 'menu-watchlist', 'watchlist-bottom-icon'], ['#top-menu-watchlist-btn', '#top-menu-watchlist-li', '[data-plugin-id="watchlist"]', '.menu-watchlist'], 'watchlist-menu');
      return 'Watchlist';
    }

    // 10. Help & Documentation / About
    if (textToMatch.includes('help') || textToMatch.includes('about') || textToMatch.includes('guide') || textToMatch.includes('instruction') || textToMatch.includes('info') || textToMatch.includes('manual')) {
      this.triggerKeepTrackNavigation(['about-bottom-icon', 'menu-about', 'about-menu-icon'], ['#menu-about', '#top-menu-about', '#about-menu', '[data-plugin-id="about"]'], 'about-menu');
      return 'Help & About Dialog';
    }

    // 11. Open / Close Chatbot Window
    if (textToMatch.includes('chatbot') || textToMatch.includes('chat window') || textToMatch.includes('ai assistant')) {
      if (rawLower.includes('close') || rawLower.includes('hide')) {
        this.closeChat();
        return 'Chatbot Hidden';
      }
      this.openChat();
      return 'RAG AI Chatbot Window';
    }

    // 12. Simulation Time Controls (Pause, Play, Fast Forward, Rewind)
    if (textToMatch.includes('pause') || textToMatch.includes('stop time') || textToMatch.includes('freeze') || textToMatch.includes('halt')) {
      try {
        const timeMgr = ServiceLocator.getTimeManager();
        if (timeMgr && typeof (timeMgr as any).pause === 'function') {
          (timeMgr as any).pause();
          return 'Time Paused';
        }
      } catch {
        // ignore
      }
      this.triggerKeepTrackNavigation(['vcr-play-pause-btn'], ['#vcr-play-pause-btn', '.vcr-btn']);
      return 'Time Paused';
    }

    if (textToMatch.includes('play') || textToMatch.includes('resume') || textToMatch.includes('start time') || textToMatch.includes('unpause')) {
      try {
        const timeMgr = ServiceLocator.getTimeManager();
        if (timeMgr && typeof (timeMgr as any).play === 'function') {
          (timeMgr as any).play();
          return 'Time Resumed';
        }
      } catch {
        // ignore
      }
      this.triggerKeepTrackNavigation(['vcr-play-pause-btn'], ['#vcr-play-pause-btn', '.vcr-btn']);
      return 'Time Resumed';
    }

    if (textToMatch.includes('fast forward') || textToMatch.includes('speed up') || textToMatch.includes('faster')) {
      this.triggerKeepTrackNavigation(['vcr-fast-forward-btn'], ['#vcr-fast-forward-btn', '.vcr-fast-forward']);
      return 'Time Fast-Forwarded';
    }

    if (textToMatch.includes('rewind') || textToMatch.includes('reverse time') || textToMatch.includes('backwards')) {
      this.triggerKeepTrackNavigation(['vcr-rewind-btn'], ['#vcr-rewind-btn', '.vcr-rewind']);
      return 'Time Rewound';
    }

    // 13. Camera & View Commands
    if (textToMatch.includes('reset camera') || textToMatch.includes('reset view') || textToMatch.includes('home view') || textToMatch.includes('center earth') || textToMatch.includes('default view')) {
      try {
        const uiMgr = ServiceLocator.getUiManager();
        if (uiMgr && typeof (uiMgr as any).resetCamera === 'function') {
          (uiMgr as any).resetCamera();
          return 'Camera Reset';
        }
      } catch {
        // ignore
      }
    }

    // 14. Clear Selection / Close Dialogs
    if (textToMatch.includes('clear selection') || textToMatch.includes('deselect') || textToMatch.includes('close all') || textToMatch.includes('close dialog') || textToMatch.includes('clear')) {
      try {
        const uiMgr = ServiceLocator.getUiManager();
        if (uiMgr && typeof (uiMgr as any).clearSelectedSat === 'function') {
          (uiMgr as any).clearSelectedSat();
        }
      } catch {
        // ignore
      }
      this.triggerKeepTrackNavigation(['close-btn'], ['.side-menu-close', '#rag-close-btn']);
      return 'Selection & Dialogs Cleared';
    }

    return null;
  }

  private triggerKeepTrackNavigation(iconIds: string[], fallbackSelectors: string[], sideMenuContainerId?: string): boolean {
    let triggered = false;

    // 1. Try native KeepTrack bottomIconPress & EventBus for all candidate icon IDs
    for (const iconId of iconIds) {
      try {
        const uiMgr = ServiceLocator.getUiManager();
        if (uiMgr && typeof uiMgr.bottomIconPress === 'function') {
          uiMgr.bottomIconPress(<HTMLElement>{ id: iconId });
          triggered = true;
        }
      } catch {
        // ignore
      }

      try {
        EventBus.getInstance().emit(EventBusEvent.bottomMenuClick, iconId);
        triggered = true;
      } catch {
        // ignore
      }
    }

    // 2. Try DOM element clicks & query selectors
    const allSelectors = [...iconIds, ...iconIds.map((id) => `#${id}`), ...fallbackSelectors];
    for (const selector of allSelectors) {
      let el = getEl(selector);
      if (!el) {
        try {
          el = document.querySelector(selector);
        } catch {
          // ignore
        }
      }
      if (el) {
        try {
          (el as HTMLElement).click();
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          triggered = true;
        } catch {
          // ignore
        }
      }
    }

    // 3. Fallback: Force side menu display if hidden
    if (sideMenuContainerId) {
      const menuEl = getEl(sideMenuContainerId) || document.querySelector(`#${sideMenuContainerId}`);
      if (menuEl) {
        menuEl.classList.remove('start-hidden', 'hidden');
        (menuEl as HTMLElement).style.display = 'block';
        triggered = true;
      }
    }

    return triggered;
  }

  public toggleChat(): void {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  public openChat(): void {
    this.isOpen = true;
    const container = getEl('rag-chatbot-container');
    container?.classList.add('rag-open');
    const input = getEl('rag-chat-input') as HTMLInputElement;
    setTimeout(() => {
      input?.focus();
      input?.click();
    }, 150);
  }

  public closeChat(): void {
    this.isOpen = false;
    const container = getEl('rag-chatbot-container');
    container?.classList.remove('rag-open');
  }

  public clearChat(): void {
    this.chatHistory = [];
    const body = getEl('rag-chat-body');
    if (body) {
      body.innerHTML = '';
    }
    this.sendInitialGreeting();
  }

  private sendInitialGreeting(): void {
    const greeting = this.ragEngine.generateAnswer('hello');
    this.appendBotMessage(greeting.answer, greeting.suggestedQuestions);
  }

  private handleFormSubmit(): void {
    const input = getEl('rag-chat-input') as HTMLInputElement;
    if (!input) return;

    const userQuery = input.value.trim();
    if (!userQuery) return;

    input.value = '';
    setTimeout(() => input.focus(), 50);

    this.sendMessageText(userQuery);
  }

  private sendMessageText(userQuery: string): void {
    this.appendUserMessage(userQuery);
    this.processQuery(userQuery);
  }

  private async processQuery(query: string): Promise<void> {
    const typingIndicator = this.appendTypingIndicator();
    const response = await this.ragEngine.generateAnswerAsync(query);
    this.removeTypingIndicator(typingIndicator);

    this.appendBotMessage(response.answer, response.suggestedQuestions, response.isChatGPT);

    if (this.isVoiceAssistantActive && this.voiceAssistant.isTtsEnabled()) {
      this.showVoiceBubble(response.answer);
      this.voiceAssistant.speak(response.answer);
    }
  }

  private appendTypingIndicator(): HTMLElement | null {
    const body = getEl('rag-chat-body');
    if (!body) return null;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'rag-message bot rag-typing-msg';
    typingDiv.innerHTML = `
      <div class="rag-msg-avatar">🤖</div>
      <div class="rag-msg-bubble">
        <span class="rag-typing-dot">.</span><span class="rag-typing-dot">.</span><span class="rag-typing-dot">.</span>
      </div>
    `;

    body.appendChild(typingDiv);
    body.scrollTop = body.scrollHeight;
    return typingDiv;
  }

  private removeTypingIndicator(el: HTMLElement | null): void {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  private appendUserMessage(text: string): void {
    this.chatHistory.push({ sender: 'user', text });
    const body = getEl('rag-chat-body');
    if (!body) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'rag-message user';
    msgDiv.innerHTML = `
      <div class="rag-msg-avatar">👤</div>
      <div class="rag-msg-bubble">${this.escapeHtml(text)}</div>
    `;

    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight;
  }

  private appendBotMessage(markdownText: string, suggestions: string[] = [], isChatGPT = false): void {
    this.chatHistory.push({ sender: 'bot', text: markdownText });
    const body = getEl('rag-chat-body');
    if (!body) return;

    const formattedHtml = this.renderMarkdown(markdownText);
    const badge = isChatGPT ? `<span class="rag-gpt-badge">⚡ Powered by ChatGPT</span>` : '';

    const msgDiv = document.createElement('div');
    msgDiv.className = 'rag-message bot';
    msgDiv.innerHTML = `
      <div class="rag-msg-avatar">🤖</div>
      <div class="rag-msg-bubble">
        ${badge}
        ${formattedHtml}
      </div>
    `;

    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight;

    this.renderSuggestions(suggestions);
  }

  private renderSuggestions(suggestions: string[]): void {
    const container = getEl('rag-chips-container');
    if (!container) return;

    container.innerHTML = '';
    for (const sugg of suggestions) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'rag-chip';
      chip.textContent = sugg;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.sendMessageText(sugg);
      });
      container.appendChild(chip);
    }
  }

  private toggleVoiceInput(): void {
    const micBtn = getEl('rag-mic-btn');
    const voiceBanner = getEl('rag-voice-banner');

    this.voiceAssistant.startListening(
      (transcript, isFinal) => {
        const input = getEl('rag-chat-input') as HTMLInputElement;
        if (input) {
          input.value = transcript;
        }

        if (isFinal) {
          this.handleFormSubmit();
        }
      },
      (isListening) => {
        micBtn?.classList.toggle('listening', isListening);
        if (voiceBanner) {
          voiceBanner.style.display = isListening ? 'flex' : 'none';
        }
      },
      (errMsg) => {
        console.warn(errMsg);
      }
    );
  }

  private renderMarkdown(text: string): string {
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Keyboard shortcut capability
  getKeyboardShortcuts(): IKeyboardShortcut[] {
    return [
      {
        key: 'A',
        code: 'KeyA',
        alt: true,
        callback: () => this.toggleChat(),
      },
    ];
  }
}
