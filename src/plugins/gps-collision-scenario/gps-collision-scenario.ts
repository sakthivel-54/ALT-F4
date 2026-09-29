import { CatalogManager } from '@app/app/data/catalog-manager';
import { ToastMsgType } from '@app/engine/core/interfaces';
import { PluginRegistry } from '@app/engine/core/plugin-registry';
import { ServiceLocator } from '@app/engine/core/service-locator';
import { EventBus } from '@app/engine/events/event-bus';
import { EventBusEvent } from '@app/engine/events/event-bus-events';
import { KeepTrackPlugin } from '@app/engine/plugins/base-plugin';
import { html } from '@app/engine/utils/development/formatter';
import { getEl } from '@app/engine/utils/get-el';
import { Satellite } from '@ootk/src/main';
import { saveAs } from 'file-saver';
import { SoundNames } from '@app/engine/audio/sounds';
import { runBreakup } from '../breakup/breakup-runner';
import { SelectSatManager } from '../select-sat-manager/select-sat-manager';
import { TopMenu } from '../top-menu/top-menu';
import './gps-collision-scenario.css';

export class GpsCollisionScenario extends KeepTrackPlugin {
  readonly id = 'GpsCollisionScenario';
  dependencies_ = [SelectSatManager.name];

  private selectSatManager_!: SelectSatManager;
  private lastDebrisIds_: number[] = [];

  constructor() {
    super();
    this.selectSatManager_ = PluginRegistry.getPlugin(SelectSatManager) as unknown as SelectSatManager;
  }

  addHtml(): void {
    super.addHtml();

    EventBus.getInstance().on(EventBusEvent.uiManagerInit, () => {
      const navWrapper = getEl(TopMenu.NAV_WRAPPER_ID);
      const navRight = getEl(TopMenu.TOP_RIGHT_ID);

      if (navWrapper && !getEl('btn-gps-collision-scenario', true)) {
        const btn = document.createElement('button');
        btn.id = 'btn-gps-collision-scenario';
        btn.className = 'waves-effect';
        btn.setAttribute('title', 'NASA Space Safety: Trigger Hypervelocity Kinetic Collision Scenario (GPS IIF vs Space Debris)');
        btn.innerHTML = html`
          <span class="gps-scenario-indicator"></span>
          <span>💥 GPS DEBRIS COLLISION</span>
        `;

        if (navRight) {
          navRight.before(btn);
        } else {
          navWrapper.appendChild(btn);
        }
      }
    });
  }

  addJs(): void {
    super.addJs();

    EventBus.getInstance().on(EventBusEvent.onKeepTrackReady, () => {
      // Ensure on initial page load, all satellites and debris are fully visible without isolation
      ServiceLocator.getGroupsManager()?.clearSelect();
      settingsManager.lastSearch = '';
      settingsManager.lastSearchResults = [];

      // Clean URL query / hash if it was a search query
      if (globalThis.location?.search?.includes('search=')) {
        globalThis.history?.replaceState?.(null, '', globalThis.location.pathname);
      }
      if (globalThis.location?.hash?.length > 1) {
        globalThis.history?.replaceState?.(null, '', globalThis.location.pathname);
      }

      // Hide and clear search results dropdown on startup
      const searchResultsEl = getEl('search-results', true);
      if (searchResultsEl) {
        searchResultsEl.style.display = 'none';
        searchResultsEl.innerHTML = '';
      }
      const searchDom = <HTMLInputElement>getEl('search', true);
      if (searchDom) {
        searchDom.value = '';
      }
      ServiceLocator.getUiManager()?.searchManager?.hideResults();

      // Reset and calculate full dense layers for all object types (payloads, debris, rocket bodies)
      const csm = ServiceLocator.getColorSchemeManager();
      if (csm) {
        csm.resetObjectTypeFlags();
        csm.calculateColorBuffers(true);
      }
    });

    EventBus.getInstance().on(EventBusEvent.uiManagerFinal, () => {
      getEl('btn-gps-collision-scenario', true)?.addEventListener('click', () => {
        this.triggerCollisionScenario();
      });
    });
  }

  /**
   * Orchestrates the hypervelocity kinetic collision scenario between
   * a GPS satellite and untracked space debris.
   */
  triggerCollisionScenario(): void {
    const catalogManager = ServiceLocator.getCatalogManager();
    const uiManager = ServiceLocator.getUiManager();

    // 1. Locate GPS Satellite
    let gpsSat: Satellite | null = null;
    for (const obj of catalogManager.objectCache) {
      if (obj && obj.isSatellite?.()) {
        const sat = obj as Satellite;
        const name = (sat.name || '').toUpperCase();
        if (name.includes('GPS') || name.includes('NAVSTAR') || sat.sccNum === '36585') {
          gpsSat = sat;
          break;
        }
      }
    }

    if (!gpsSat) {
      // Fallback to any valid operational satellite in catalog
      for (const obj of catalogManager.objectCache) {
        if (obj && obj.isSatellite?.()) {
          gpsSat = obj as Satellite;
          break;
        }
      }
    }

    if (!gpsSat) {
      uiManager.toast('Catalog not ready. Please wait for catalog initialization.', ToastMsgType.caution, true);
      return;
    }

    // 2. Camera lock and focus on GPS Satellite without group isolation
    // (Preserve all satellites, debris, and objects in the dense orbital swarm)
    this.selectSatManager_.selectSat(gpsSat.id);
    ServiceLocator.getGroupsManager().clearSelect();
    uiManager.searchManager.hideResults();

    // Initial Tracking & Ingress Warning
    uiManager.toast(`⚠️ INGRESS ALERT: Untracked hypervelocity kinetic debris closing in on ${gpsSat.name}!`, ToastMsgType.caution, true);

    // Create Ingress HUD Overlay
    getEl('gps-ingress-overlay', true)?.remove();
    const ingressOverlay = document.createElement('div');
    ingressOverlay.id = 'gps-ingress-overlay';
    ingressOverlay.className = 'gps-ingress-hud';
    ingressOverlay.innerHTML = html`
      <div class="gps-ingress-header">
        <span class="gps-ingress-beacon"></span>
        <span class="gps-ingress-title">CONJUNCTION TRAJECTORY INTERCEPT</span>
      </div>
      <div class="gps-ingress-details">
        <div><strong>TARGET:</strong> ${gpsSat.name} (NORAD #${gpsSat.sccNum})</div>
        <div><strong>APPROACH VELOCITY:</strong> 10.42 km/s (Mach 30.6)</div>
        <div><strong>RANGE:</strong> <span id="gps-ingress-range">3.2 km</span> // T-MINUS <span id="gps-ingress-timer">1.8s</span></div>
      </div>
      <div class="gps-ingress-progress"><div class="gps-ingress-progress-bar"></div></div>
    `;
    document.body.appendChild(ingressOverlay);

    // Cinematic approach countdown before clash
    const targetSat = gpsSat;
    setTimeout(() => {
      const rangeEl = getEl('gps-ingress-range', true);
      const timerEl = getEl('gps-ingress-timer', true);
      if (rangeEl) rangeEl.textContent = '0.9 km';
      if (timerEl) timerEl.textContent = '0.8s';
    }, 700);

    setTimeout(() => {
      // CLASH / KINETIC IMPACT MOMENT
      ingressOverlay.remove();
      this.executeKineticClash(targetSat);
    }, 1500);
  }

  /**
   * Executes the kinetic clash: triggers system notifications, screen flash,
   * orbital breakup physics, and the telemetry & reconnaissance modal.
   */
  private executeKineticClash(sat: Satellite): void {
    const uiManager = ServiceLocator.getUiManager();

    // 1. Screen impact flash effect
    document.body.classList.add('gps-impact-flash');
    setTimeout(() => document.body.classList.remove('gps-impact-flash'), 650);

    // 2. Play audible impact alarm
    try {
      ServiceLocator.getSoundManager()?.play(SoundNames.BEEP);
    } catch {
      // Audio optional
    }

    // 3. UNMISTAKABLE CRITICAL NOTIFICATION TOAST
    uiManager.toast(
      `🚨 CRITICAL CONJUNCTION: Space debris collision confirmed on ${sat.name}! Catastrophic bus disruption & loss of signal detected.`,
      ToastMsgType.error,
      true
    );

    // 4. Native Browser Notification (if supported)
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification('NASA Space Safety // KINETIC IMPACT', {
          body: `Collision confirmed on ${sat.name} (NORAD #${sat.sccNum}). 42 fragments actively propagating.`,
          icon: './img/icons/warning.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('NASA Space Safety // KINETIC IMPACT', {
              body: `Collision confirmed on ${sat.name} (NORAD #${sat.sccNum}).`,
              icon: './img/icons/warning.png',
            });
          }
        });
      }
    }

    // 5. Persistent Emergency Dashboard Notification Banner
    getEl('gps-collision-alert-banner', true)?.remove();
    const banner = document.createElement('div');
    banner.id = 'gps-collision-alert-banner';
    banner.className = 'gps-emergency-banner';
    banner.innerHTML = html`
      <span class="gps-beacon-icon">🚨</span>
      <span class="gps-emergency-text">
        <strong>MISSION EMERGENCY:</strong> KINETIC COLLISION DETECTED // <strong>${sat.name} (NORAD #${sat.sccNum})</strong> DESTROYED // 42 DEBRIS FRAGMENTS EXPANDING // LOS CONFIRMED
      </span>
      <button id="gps-banner-reopen-btn" class="gps-banner-btn">📹 VIEW TELEMETRY &amp; CAMERA FEED</button>
      <button id="gps-banner-close-btn" class="gps-banner-close" title="Dismiss Alert">&times;</button>
    `;
    document.body.appendChild(banner);

    // 6. Trigger physical breakup with kinetic impact physics
    const epoch = ServiceLocator.getTimeManager()?.simulationTimeObj ?? new Date();
    const breakupParams = {
      breakupCount: 42,
      radialDeltaV: 260,
      inTrackDeltaV: 380,
      crossTrackDeltaV: 190,
      startNum: CatalogManager.ANALYST_START_ID,
    };
    const impact = {
      velocityTeme: { x: 7.3, y: -3.8, z: 5.4 },
      transferFraction: 0.14,
    };

    const result = runBreakup(sat, breakupParams, epoch, impact);
    this.lastDebrisIds_ = result.createdIds;

    // 7. Present Scientific NASA Mission Operations Alert & Telemetry Modal
    this.showCollisionTelemetryModal(sat, result.createdIds.length, epoch);

    // Banner event handlers
    getEl('gps-banner-close-btn', true)?.addEventListener('click', () => banner.remove());
    getEl('gps-banner-reopen-btn', true)?.addEventListener('click', () => {
      this.showCollisionTelemetryModal(sat, result.createdIds.length, epoch);
    });
  }

  /**
   * Displays the detailed scientific HUD modal containing multi-sensor telemetry,
   * optical tracking video feed, camera data, radar cross section shift, and spacecraft bus failure metrics.
   */
  private showCollisionTelemetryModal(sat: Satellite, fragmentCount: number, epoch: Date): void {
    // Remove existing modal if open
    getEl('gps-collision-modal', true)?.remove();

    const timestampUtc = epoch.toISOString().replace('T', ' ').replace('Z', ' UTC');
    const modal = document.createElement('div');
    modal.id = 'gps-collision-modal';

    modal.innerHTML = html`
      <div class="gps-modal-header">
        <div class="gps-modal-title-group">
          <span class="gps-alert-badge">CRITICAL CONJUNCTION</span>
          <div>
            <h3 class="gps-modal-title">NASA MISSION OPERATIONS // KINETIC IMPACT EVENT</h3>
            <div class="gps-modal-subtitle">EVENT REF: ORB-COL-GPS-${sat.sccNum} // CLASSIFICATION: CATASTROPHIC VEHICLE DISRUPTION</div>
          </div>
        </div>
        <button class="gps-modal-close-btn" id="gps-modal-btn-x">&times;</button>
      </div>

      <div class="gps-modal-body">
        <!-- Section 1: High-Resolution Optical Reconnaissance & Tracking Video Feed -->
        <div class="gps-hud-card video-card">
          <div class="gps-card-header">
            <span class="gps-card-title">📹 HIGH-SPEED OPTICAL RECONNAISSANCE &amp; IMPACT CAMERA FEED</span>
            <span class="gps-data-value danger">MSSC AEOS 3.67m ADAPTIVE OPTICS // 240 FPS // FLIR SWIR</span>
          </div>
          <div class="gps-video-container">
            <div class="gps-video-hud-overlay">
              <div class="gps-video-hud-tl"><span class="gps-rec-dot"></span> LIVE-PLAYBACK 240 FPS</div>
              <div class="gps-video-hud-tr">TGT: ${sat.name} // LOS: CONFIRMED</div>
              <div class="gps-video-hud-bl">FOV: 0.12&deg; NFOV // BAND: SWIR 1.2&micro;m</div>
              <div class="gps-video-hud-br">IMPACT VELOCITY: 10.42 km/s</div>
            </div>
            <video id="gps-collision-video" class="gps-video-player" src="./videos/collision_simulation.mp4" autoplay loop muted controls playsinline></video>
          </div>
          <div class="gps-video-controls-bar">
            <div class="gps-video-btn-group">
              <button id="gps-vid-btn-replay" class="gps-vid-btn">🔄 Replay Impact</button>
              <button id="gps-vid-btn-speed" class="gps-vid-btn">⏱️ 0.5x Slow-Mo</button>
              <button id="gps-vid-btn-pause" class="gps-vid-btn">⏯️ Play / Pause</button>
            </div>
            <span class="gps-vid-caption">
              Visual telemetry captures hypervelocity space debris conjunction, instantaneous kinetic shockwave, bus rupture, and fragment dispersion envelope.
            </span>
          </div>
        </div>

        <!-- Section 2: Astrodynamics & Conjunction Dynamics -->
        <div class="gps-hud-grid">
          <div class="gps-hud-card critical">
            <div class="gps-card-header">
              <span class="gps-card-title">Target Spacecraft</span>
              <span class="gps-data-value danger">LOSS OF SIGNAL (LOS)</span>
            </div>
            <div class="gps-data-row"><span class="gps-data-label">Vehicle Name:</span><span class="gps-data-value">${sat.name}</span></div>
            <div class="gps-data-row"><span class="gps-data-label">NORAD SCC / Int. Des:</span><span class="gps-data-value">#${sat.sccNum}</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Regime:</span><span class="gps-data-value">MEO Semi-Synchronous (12h)</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Orbital Altitude:</span><span class="gps-data-value">20,184.2 km</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Bus Integrity:</span><span class="gps-data-value danger">0% (STRUCTURAL BREACH)</span></div>
          </div>

          <div class="gps-hud-card critical">
            <div class="gps-card-header">
              <span class="gps-card-title">Impactor Kinematics</span>
              <span class="gps-data-value warning">HYPERVELOCITY</span>
            </div>
            <div class="gps-data-row"><span class="gps-data-label">Object Type:</span><span class="gps-data-value">Tracked Debris Fragment</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Estimated Mass / Size:</span><span class="gps-data-value">280 grams / ~5.2 cm</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Relative Impact Velocity:</span><span class="gps-data-value danger">10.42 km/s (Mach 30.6)</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Specific Kinetic Energy:</span><span class="gps-data-value">1.52 &times; 10&#8311; Joules</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Conjunction Ingress Angle:</span><span class="gps-data-value">78.4&deg; Prograde-Polar Crossing</span></div>
          </div>

          <div class="gps-hud-card">
            <div class="gps-card-header">
              <span class="gps-card-title">Dispersion Cloud Status</span>
              <span class="gps-data-value success">ACTIVE PROPAGATION</span>
            </div>
            <div class="gps-data-row"><span class="gps-data-label">Conjunction Epoch:</span><span class="gps-data-value">${timestampUtc}</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Tracked Secondary Fragments:</span><span class="gps-data-value warning">${fragmentCount.toString()} pieces &gt; 5cm</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Radial Velocity Spread:</span><span class="gps-data-value">&plusmn;260 m/s</span></div>
            <div class="gps-data-row"><span class="gps-data-label">In-Track Velocity Spread:</span><span class="gps-data-value">&plusmn;380 m/s</span></div>
            <div class="gps-data-row"><span class="gps-data-label">Catalog Analyst Range:</span><span class="gps-data-value">NORAD 90000 - 90041</span></div>
          </div>
        </div>

        <!-- Section 3: Sensor Tracking Arrays (SSN Radar & Optical) -->
        <div class="gps-hud-card">
          <div class="gps-card-header">
            <span class="gps-card-title">Space Surveillance Network (SSN) Multi-Sensor Detections</span>
            <span class="gps-data-value">RADAR &amp; OPTICAL ARRAYS</span>
          </div>
          <div class="gps-hud-grid">
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#x25C9; Eglin AFB AN/FPS-85 Phased Array Radar</div>
              <div class="gps-sensor-desc">Instantaneous Radar Cross Section (RCS) collapsed from nominal 4.4 m&sup2; to multi-track fragment cloud. Doppler delta &Delta;v = +3.1 km/s detected on ejection vector.</div>
            </div>
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#x25C9; Clear SFS SSPARS (Space Force Early Warning Radar)</div>
              <div class="gps-sensor-desc">Multi-target centroid tracking lock established. Ballistic coefficient degradation confirmed. Secondary debris orbits injected into orbital cruncher.</div>
            </div>
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#x25C9; GEODSS Optical Sensors (Maui &amp; Diego Garcia)</div>
              <div class="gps-sensor-desc">High-speed photometric flare detected at impact epoch (+11.4 to +4.2 apparent mag flash), followed by rapid periodic tumbling light curve.</div>
            </div>
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#x25C9; MSSC AEOS 3.67m Telescope (Adaptive Optics Camera)</div>
              <div class="gps-sensor-desc">Visual framing captures starboard solar array separation, ruptured Multi-Layer Insulation (MLI), and rapid debris envelope expansion at 380 m/s.</div>
            </div>
          </div>
        </div>

        <!-- Section 4: Spacecraft Health & Telemetry Logs -->
        <div class="gps-hud-card">
          <div class="gps-card-header">
            <span class="gps-card-title">Spacecraft Subsystem Health Telemetry (Last Frame Prior to LOS)</span>
            <span class="gps-data-value danger">2 SOPS SCHRIEVER SFB CONFIRMED</span>
          </div>
          <div class="gps-hud-grid">
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#9889; Power Subsystem (EPS)</div>
              <div class="gps-sensor-desc">Main Bus Voltage: <strong>0.0V</strong> (was 28.2V). Solar array power output dropped to 0W. Primary batteries short-circuited.</div>
            </div>
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#128225; L-Band Navigation Payload</div>
              <div class="gps-sensor-desc">L1 (1575.42 MHz), L2 (1227.60 MHz), and L5 carriers terminated. Ground station C/No dropped to 0 dB-Hz worldwide.</div>
            </div>
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#128377; Tri-Axial IMU &amp; Gyroscopes</div>
              <div class="gps-sensor-desc">Peak structural mechanical shock: <strong>+54.8g</strong> along transverse axis. Angular momentum exceeded momentum wheel saturation thresholds.</div>
            </div>
            <div class="gps-sensor-block">
              <div class="gps-sensor-name">&#127777; Propulsion &amp; Thermal Control</div>
              <div class="gps-sensor-desc">Hydrazine propellant tank pressure dropped from 320 PSI to 0 PSI in 11 milliseconds due to kinetic puncture.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="gps-modal-footer">
        <button id="gps-modal-btn-track-cloud" class="gps-action-btn">
          <span>&#128301; Track Debris Cloud</span>
        </button>
        <button id="gps-modal-btn-export" class="gps-action-btn secondary">
          <span>&#128190; Export Conjunction Report (JSON)</span>
        </button>
        <button id="gps-modal-btn-close" class="gps-action-btn secondary">
          <span>Acknowledge &amp; Close</span>
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Video interactive controls
    const vid = modal.querySelector<HTMLVideoElement>('#gps-collision-video');
    const replayBtn = modal.querySelector<HTMLButtonElement>('#gps-vid-btn-replay');
    const speedBtn = modal.querySelector<HTMLButtonElement>('#gps-vid-btn-speed');
    const pauseBtn = modal.querySelector<HTMLButtonElement>('#gps-vid-btn-pause');

    if (vid) {
      replayBtn?.addEventListener('click', () => {
        vid.currentTime = 0;
        vid.play();
      });

      let isSlowMo = false;
      speedBtn?.addEventListener('click', () => {
        isSlowMo = !isSlowMo;
        vid.playbackRate = isSlowMo ? 0.5 : 1.0;
        speedBtn.textContent = isSlowMo ? '⏱️ 1.0x Normal' : '⏱️ 0.5x Slow-Mo';
      });

      pauseBtn?.addEventListener('click', () => {
        if (vid.paused) {
          vid.play();
          pauseBtn.textContent = '⏸️ Pause';
        } else {
          vid.pause();
          pauseBtn.textContent = '▶️ Play';
        }
      });
    }

    // Event listeners
    getEl('gps-modal-btn-x')?.addEventListener('click', () => modal.remove());
    getEl('gps-modal-btn-close')?.addEventListener('click', () => modal.remove());

    // Track Debris Cloud button (without isolating groups)
    getEl('gps-modal-btn-track-cloud')?.addEventListener('click', () => {
      if (this.lastDebrisIds_.length > 0) {
        const firstFragmentId = this.lastDebrisIds_[0];
        const obj = ServiceLocator.getCatalogManager().getObject(firstFragmentId);
        if (obj?.isSatellite?.()) {
          this.selectSatManager_.selectSat(firstFragmentId);
          ServiceLocator.getGroupsManager().clearSelect();
          ServiceLocator.getUiManager().toast(`Tracking Primary Debris Fragment #${(obj as Satellite).sccNum}`, ToastMsgType.normal, true);
        }
      }
      modal.remove();
    });

    // Export Conjunction Report
    getEl('gps-modal-btn-export')?.addEventListener('click', () => {
      const report = {
        event: 'HYPERVELOCITY_KINETIC_CONJUNCTION',
        classification: 'CATASTROPHIC_VEHICLE_DISRUPTION',
        timestampUtc: epoch.toISOString(),
        target: {
          name: sat.name,
          scc: sat.sccNum,
          regime: 'MEO_SEMI_SYNCHRONOUS',
          altitudeKm: 20184.2,
          busStatus: 'STRUCTURAL_RUPTURE_COMPLETE_LOS',
        },
        impactor: {
          type: 'SPACE_DEBRIS_KINETIC_FRAGMENT',
          estimatedMassGrams: 280,
          estimatedSizeCm: 5.2,
          relativeVelocityKms: 10.42,
          kineticEnergyJoules: 1.52e7,
          ingressAngleDeg: 78.4,
        },
        sensors: {
          radar: [
            { station: 'Eglin AFB AN/FPS-85', finding: 'RCS collapse, Doppler delta +3.1 km/s' },
            { station: 'Clear SFS SSPARS', finding: 'Multi-target centroid tracking lock established' },
          ],
          optical: [
            { station: 'GEODSS Maui/Diego Garcia', finding: '+4.2 mag optical flash detected' },
            { station: 'AEOS 3.67m Adaptive Optics', finding: 'Visual confirmation of bus rupture & solar wing detachment' },
          ],
          telemetry: {
            powerBusVoltage: 0.0,
            navigationPayload: 'TERMINATED',
            imuShockPeakG: 54.8,
            propellantTankPressurePsi: 0,
          },
        },
        fragmentsCreated: fragmentCount,
        fragmentAnalystRange: '90000-90041',
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      saveAs(blob, `NASA_GPS_COLLISION_REPORT_${sat.sccNum}.json`);
      ServiceLocator.getUiManager().toast('Scientific Conjunction Report exported successfully!', ToastMsgType.normal, true);
    });
  }
}
