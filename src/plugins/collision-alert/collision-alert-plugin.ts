/**
 * Collision Alert System Plugin
 * 
 * Provides orbital collision simulation on critical satellites (ISS, Tiangong, Hubble, etc.)
 * with high-visibility main system alerts, red debris cloud generation, and silicon/red
 * visual differentiation.
 */

import { CatalogManager } from '@app/app/data/catalog-manager';
import { GetSatType, ToastMsgType } from '@app/engine/core/interfaces';
import { PluginRegistry } from '@app/engine/core/plugin-registry';
import { ServiceLocator } from '@app/engine/core/service-locator';
import { EventBus } from '@app/engine/events/event-bus';
import { EventBusEvent } from '@app/engine/events/event-bus-events';
import { KeepTrackPlugin } from '@app/engine/plugins/base-plugin';
import { ICommandPaletteCapable, ICommandPaletteCommand, IKeyboardShortcut } from '@app/engine/plugins/core/plugin-capabilities';
import { html } from '@app/engine/utils/development/formatter';
import { errorManagerInstance } from '@app/engine/utils/errorManager';
import { getEl } from '@app/engine/utils/get-el';
import { Satellite } from '@ootk/src/main';
import { clearBreakupPieces, runBreakup } from '../breakup/breakup-runner';
import { SelectSatManager } from '../select-sat-manager/select-sat-manager';
import { TopMenu } from '../top-menu/top-menu';
import './collision-alert.css';

export interface CollisionTargetPreset {
  name: string;
  sccNum: string;
  description: string;
}

export const IMPORTANT_TARGETS: CollisionTargetPreset[] = [
  { name: 'ISS (ZARYA)', sccNum: '25544', description: 'International Space Station (Low Earth Orbit)' },
  { name: 'TIANGONG (CSS)', sccNum: '48274', description: 'Chinese Space Station (Low Earth Orbit)' },
  { name: 'HUBBLE SPACE TELESCOPE', sccNum: '20580', description: 'NASA/ESA Space Observatory' },
  { name: 'ENVISAT', sccNum: '27386', description: 'Large Defunct Earth Observation Asset' },
];

export class CollisionAlertPlugin extends KeepTrackPlugin implements ICommandPaletteCapable {
  readonly id = 'CollisionAlertPlugin';
  dependencies_ = [SelectSatManager.name];
  private selectSatManager_: SelectSatManager | null = null;
  private lastPieceIds_: number[] = [];
  private lastTargetSatId_: number | null = null;
  private lastTargetSatName_ = '';
  private lastTargetScc_ = '';
  private countdownTimer_: number | null = null;

  constructor() {
    super();
  }

  addHtml(): void {
    super.addHtml();

    const insertTopNavBtn = () => {
      const navRight = getEl(TopMenu.TOP_RIGHT_ID);
      if (!navRight || getEl('top-menu-collision-alert-li')) {
        return;
      }

      navRight.insertAdjacentHTML(
        'afterbegin',
        html`
          <li id="top-menu-collision-alert-li" class="collision-alert-btn-wrapper">
            <button id="top-menu-collision-alert-btn" class="collision-alert-nav-btn" type="button" title="Simulate Catastrophic Satellite Collision">
              <span class="alert-beacon-icon">🚨</span> COLLISION ALERT
            </button>
          </li>
        `
      );

      getEl('top-menu-collision-alert-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openCollisionModal();
      });
    };

    EventBus.getInstance().on(EventBusEvent.uiManagerInit, insertTopNavBtn);
    EventBus.getInstance().on(EventBusEvent.uiManagerFinal, insertTopNavBtn);
  }

  addJs(): void {
    super.addJs();

    try {
      this.selectSatManager_ = PluginRegistry.getPlugin(SelectSatManager) as unknown as SelectSatManager;
    } catch {
      // Defer if not registered yet
    }

    EventBus.getInstance().on(EventBusEvent.uiManagerFinal, () => {
      if (!this.selectSatManager_) {
        this.selectSatManager_ = PluginRegistry.getPlugin(SelectSatManager) as unknown as SelectSatManager;
      }
      getEl('top-menu-collision-alert-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openCollisionModal();
      });
    });
  }

  getKeyboardShortcuts(): IKeyboardShortcut[] {
    return [
      {
        key: 'C',
        shift: true,
        callback: () => this.openCollisionModal(),
      },
    ];
  }

  getCommandPaletteCommands(): ICommandPaletteCommand[] {
    return [
      {
        id: 'CollisionAlert.open',
        label: 'Collision Alert: Open Collision Simulation Panel',
        category: 'Analysis',
        callback: () => this.openCollisionModal(),
      },
      {
        id: 'CollisionAlert.triggerIss',
        label: 'Collision Alert: Trigger Instant ISS Collision Impact',
        category: 'Analysis',
        callback: () => this.triggerCollision('25544', 45),
      },
      {
        id: 'CollisionAlert.clear',
        label: 'Collision Alert: Clear Active Collision Debris',
        category: 'Analysis',
        callback: () => this.clearCollision(),
        isAvailable: () => this.lastPieceIds_.length > 0,
      },
    ];
  }

  /**
   * Opens the interactive Collision Alert control modal.
   */
  openCollisionModal(): void {
    const existingModal = getEl('collision-alert-modal-backdrop');
    if (existingModal) {
      existingModal.remove();
    }

    const currentSelected = this.getCurrentlySelectedSatellite();
    let currentSelectedOption = '';
    if (currentSelected) {
      currentSelectedOption = `<option value="${currentSelected.sccNum}">[CURRENT SELECTED] ${currentSelected.name} (${currentSelected.sccNum})</option>`;
    }

    const modalHtml = html`
      <div id="collision-alert-modal-backdrop" class="collision-modal-backdrop">
        <div class="collision-modal-panel" role="dialog" aria-modal="true" aria-labelledby="collision-modal-title">
          <div class="collision-modal-header">
            <div id="collision-modal-title" class="collision-modal-title">
              <span>🚨</span>
              <span>ORBITAL COLLISION EMERGENCY SIMULATOR</span>
            </div>
            <button id="collision-modal-close-btn" class="collision-modal-close" type="button" aria-label="Close">&times;</button>
          </div>

          <div class="collision-info-box">
            Simulate a hypervelocity kinetic collision with space debris on critical orbital infrastructure.
            Active satellites are highlighted in <strong>Silicon Cyan</strong>, and created impact fragments are tracked in <strong>Red Alert</strong>.
            <div class="collision-legend-preview">
              <span class="legend-chip"><span class="legend-dot silicon"></span> Active Satellites (Silicon)</span>
              <span class="legend-chip"><span class="legend-dot debris"></span> Debris Cloud (Red)</span>
            </div>
          </div>

          <div class="collision-form-group">
            <label class="collision-label" for="collision-target-select">Select Critical Satellite Target:</label>
            <select id="collision-target-select" class="collision-select">
              ${currentSelectedOption}
              ${IMPORTANT_TARGETS.map(
                (target) => html`
                  <option value="${target.sccNum}" ${target.sccNum === '25544' && !currentSelected ? 'selected' : ''}>
                    ${target.name} [SCC: ${target.sccNum}] - ${target.description}
                  </option>
                `
              ).join('')}
            </select>
          </div>

          <div class="collision-form-group">
            <label class="collision-label" for="collision-piece-count">Generated Debris Fragments:</label>
            <select id="collision-piece-count" class="collision-select">
              <option value="30">30 Fragments (Moderate Breakup)</option>
              <option value="45" selected>45 Fragments (Severe Catastrophic Breakup)</option>
              <option value="60">60 Fragments (Major Hypervelocity Dispersion)</option>
              <option value="80">80 Fragments (Maximum Kinetic Cloud)</option>
            </select>
          </div>

          <div class="collision-form-group">
            <label class="collision-label">Impactor Velocity & Dispersion:</label>
            <div style="font-size: 12px; color: #a1a1aa; padding: 4px 0;">
              Relative Velocity: <strong>10.8 km/s</strong> (Retrograde Hypervelocity Conjunction) &bull; Spread: <strong>&plusmn;260 m/s</strong>
            </div>
          </div>

          <div class="collision-modal-actions">
            <button id="collision-trigger-now-btn" class="collision-action-btn primary" type="button">
              💥 TRIGGER COLLISION NOW
            </button>
            <button id="collision-countdown-btn" class="collision-action-btn secondary" type="button">
              ⏱️ 5s COUNTDOWN
            </button>
            <button id="collision-cancel-btn" class="collision-action-btn tertiary" type="button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const backdrop = getEl('collision-alert-modal-backdrop');
    const closeBtn = getEl('collision-modal-close-btn');
    const cancelBtn = getEl('collision-cancel-btn');
    const triggerNowBtn = getEl('collision-trigger-now-btn');
    const countdownBtn = getEl('collision-countdown-btn');

    const closeModal = () => {
      backdrop?.remove();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    triggerNowBtn?.addEventListener('click', () => {
      const select = getEl('collision-target-select') as HTMLSelectElement | null;
      const countSelect = getEl('collision-piece-count') as HTMLSelectElement | null;
      const targetScc = select?.value || '25544';
      const pieceCount = parseInt(countSelect?.value || '45', 10);
      closeModal();
      this.triggerCollision(targetScc, pieceCount);
    });

    countdownBtn?.addEventListener('click', () => {
      const select = getEl('collision-target-select') as HTMLSelectElement | null;
      const countSelect = getEl('collision-piece-count') as HTMLSelectElement | null;
      const targetScc = select?.value || '25544';
      const pieceCount = parseInt(countSelect?.value || '45', 10);
      closeModal();
      this.startCountdown(targetScc, pieceCount);
    });
  }

  /**
   * Starts a 5-second emergency countdown with audio beeps before triggering impact.
   */
  startCountdown(targetScc: string, pieceCount: number): void {
    if (this.countdownTimer_) {
      window.clearInterval(this.countdownTimer_);
      this.countdownTimer_ = null;
    }

    let remaining = 5;
    ServiceLocator.getUiManager().toast(`🚨 IMMINENT COLLISION CONJUNCTION DETECTED: T-${remaining}s`, ToastMsgType.caution);
    this.playTone(600, 0.1);

    this.countdownTimer_ = window.setInterval(() => {
      remaining--;
      if (remaining > 0) {
        ServiceLocator.getUiManager().toast(`🚨 COLLISION IMPACT IN: T-${remaining}s`, ToastMsgType.caution);
        this.playTone(remaining === 1 ? 900 : 700, 0.12);
      } else {
        if (this.countdownTimer_) {
          window.clearInterval(this.countdownTimer_);
          this.countdownTimer_ = null;
        }
        this.triggerCollision(targetScc, pieceCount);
      }
    }, 1000);
  }

  /**
   * Simulates a catastrophic collision on the target satellite.
   */
  triggerCollision(sccNum: string, pieceCount = 45): void {
    const catalogManager = ServiceLocator.getCatalogManager();
    if (!catalogManager) {
      errorManagerInstance.warn('CatalogManager not available for collision simulation.');
      return;
    }

    let satId = catalogManager.sccNum2Id(sccNum);
    if (!satId || satId < 0) {
      // Attempt search through objectCache for matching SCC
      const cache = catalogManager.objectCache;
      for (let i = 0; i < cache.length; i++) {
        const obj = cache[i];
        if (obj && (obj as Satellite).sccNum === sccNum) {
          satId = i;
          break;
        }
      }
    }

    if (!satId || satId < 0 || !catalogManager.objectCache[satId]) {
      ServiceLocator.getUiManager().toast(`Target satellite [SCC: ${sccNum}] not found in catalog.`, ToastMsgType.caution);
      return;
    }

    const sat = catalogManager.objectCache[satId] as Satellite;
    if (!(sat instanceof Satellite)) {
      ServiceLocator.getUiManager().toast(`Object [SCC: ${sccNum}] is not a valid satellite.`, ToastMsgType.caution);
      return;
    }

    // 1. Focus and select target satellite
    if (!this.selectSatManager_) {
      this.selectSatManager_ = PluginRegistry.getPlugin(SelectSatManager) as unknown as SelectSatManager;
    }
    if (this.selectSatManager_) {
      this.selectSatManager_.selectSat(satId);
    }

    // 2. Prepare breakup execution
    const dateTimeManager = ServiceLocator.getDateTimeManager();
    const epoch = dateTimeManager?.getSimulationTimeObj() ?? new Date();

    const result = runBreakup(
      sat,
      {
        breakupCount: pieceCount,
        radialDeltaV: 260,
        inTrackDeltaV: 260,
        crossTrackDeltaV: 260,
        startNum: 90000,
      },
      epoch,
      {
        velocityTeme: { x: 7.2, y: -11.5, z: 4.8 },
        transferFraction: 0.08,
      }
    );

    if (result.error || result.createdIds.length === 0) {
      ServiceLocator.getUiManager().toast(`Failed to simulate breakup: ${result.error || 'No fragments generated'}`, ToastMsgType.critical);
      return;
    }

    this.lastPieceIds_ = result.createdIds;
    this.lastTargetSatId_ = satId;
    this.lastTargetSatName_ = sat.name;
    this.lastTargetScc_ = sat.sccNum;

    // 3. Recalculate colors so new fragments show up in bright red
    ServiceLocator.getColorSchemeManager().notifyObjectsChanged();
    ServiceLocator.getColorSchemeManager().calculateColorBuffers(true);

    // 4. Highlight target and newly generated debris in search view
    ServiceLocator.getUiManager().doSearch(`${sat.sccNum},Breakup Piece`);

    // 5. Sound tactical alarm
    this.playEmergencyAlarm();

    // 6. Viewport strobe hazard flash
    this.flashViewportStrobe();

    // 7. System Critical Toast
    ServiceLocator.getUiManager().toast(
      `🚨 CRITICAL COLLISION: Hypervelocity impact confirmed on ${sat.name} [SCC: ${sat.sccNum}]! ${result.createdIds.length} RED debris fragments generated in orbit.`,
      ToastMsgType.critical
    );

    // 8. Mount prominent Main System Emergency Banner
    this.showMainSystemEmergencyBanner(sat.name, sat.sccNum, result.createdIds.length, satId);
  }

  /**
   * Displays the persistent high-visibility Emergency Alert Banner at the top of the main viewport.
   */
  private showMainSystemEmergencyBanner(satName: string, sccNum: string, fragmentCount: number, satId: number): void {
    const existing = getEl('main-system-collision-banner');
    if (existing) {
      existing.remove();
    }

    const bannerHtml = html`
      <div id="main-system-collision-banner" class="main-system-collision-banner">
        <div class="collision-banner-content">
          <div class="collision-banner-icon">🚨</div>
          <div class="collision-banner-text">
            <div class="collision-banner-title">CRITICAL ORBITAL COLLISION DETECTED &mdash; SYSTEM ALERT</div>
            <div class="collision-banner-sub">
              Asset: <strong>${satName}</strong> [SCC: <strong>${sccNum}</strong>] &bull;
              Impact Cloud: <span class="debris-count-badge">${fragmentCount} DEBRIS FRAGMENTS (RED)</span> &bull;
              Running Satellites: <span style="color:#00e5ff;font-weight:bold;">SILICON CYAN</span>
            </div>
          </div>
        </div>
        <div class="collision-banner-actions">
          <button id="collision-focus-btn" class="collision-banner-btn focus-btn" type="button" title="Center camera on collision site">
            🎯 Focus Impact
          </button>
          <button id="collision-debris-btn" class="collision-banner-btn debris-btn" type="button" title="Track and isolate debris cloud">
            🛰️ Track Debris Cloud
          </button>
          <button id="collision-reset-btn" class="collision-banner-btn reset-btn" type="button" title="Clear debris fragments and reset catalog slots">
            🔄 Clear / Reset
          </button>
          <button id="collision-banner-close-btn" class="collision-banner-btn close-btn" type="button" title="Dismiss Banner">
            ✕
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHtml);

    getEl('collision-focus-btn')?.addEventListener('click', () => {
      if (this.selectSatManager_ && satId >= 0) {
        this.selectSatManager_.selectSat(satId);
      }
    });

    getEl('collision-debris-btn')?.addEventListener('click', () => {
      ServiceLocator.getUiManager().doSearch('Breakup Piece');
    });

    getEl('collision-reset-btn')?.addEventListener('click', () => {
      this.clearCollision();
    });

    getEl('collision-banner-close-btn')?.addEventListener('click', () => {
      getEl('main-system-collision-banner')?.remove();
    });
  }

  /**
   * Resets all generated collision fragments and restores normal orbital view.
   */
  clearCollision(): void {
    if (this.lastPieceIds_.length > 0) {
      clearBreakupPieces(this.lastPieceIds_);
      this.lastPieceIds_ = [];
    }

    getEl('main-system-collision-banner')?.remove();

    ServiceLocator.getColorSchemeManager().notifyObjectsChanged();
    ServiceLocator.getColorSchemeManager().calculateColorBuffers(true);
    ServiceLocator.getUiManager().doSearch('');
    ServiceLocator.getUiManager().toast('Collision simulation cleared. Orbital debris cloud removed.', ToastMsgType.normal);
  }

  /**
   * Flashes a red strobe overlay along the edges of the viewport for 3 seconds.
   */
  private flashViewportStrobe(): void {
    const existing = getEl('collision-strobe-overlay');
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'collision-strobe-overlay';
    overlay.className = 'collision-strobe-overlay';
    document.body.appendChild(overlay);

    window.setTimeout(() => {
      overlay.remove();
    }, 3200);
  }

  /**
   * Plays a distinct multi-tone emergency alarm using Web Audio API.
   */
  private playEmergencyAlarm(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return;
      }

      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(880, 0, 0.16);
      playTone(660, 0.18, 0.16);
      playTone(880, 0.36, 0.16);
      playTone(660, 0.54, 0.26);
    } catch {
      // Audio autoplay policy may block before user interaction
    }
  }

  /**
   * Plays a single short synthesizer tone.
   */
  private playTone(freq: number, duration: number): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio restriction
    }
  }

  /**
   * Returns the currently selected satellite if one is active.
   */
  private getCurrentlySelectedSatellite(): { name: string; sccNum: string } | null {
    try {
      if (!this.selectSatManager_) {
        this.selectSatManager_ = PluginRegistry.getPlugin(SelectSatManager) as unknown as SelectSatManager;
      }
      const sat = this.selectSatManager_?.getSelectedSat(GetSatType.EXTRA_ONLY);
      if (sat instanceof Satellite && sat.sccNum) {
        return { name: sat.name, sccNum: sat.sccNum };
      }
    } catch {
      // No selection
    }
    return null;
  }
}
