/**
 * Comprehensive Knowledge Base dataset for RAG AI Assistant with 60+ detailed Q&As.
 */
export interface KnowledgeChunk {
  id: string;
  category:
    | 'overview'
    | 'controls'
    | 'camera'
    | 'astrodynamics'
    | 'orbit-types'
    | 'sat-info'
    | 'breakup'
    | 'sensors'
    | 'time'
    | 'custom-sat'
    | 'filters'
    | 'shortcuts'
    | 'tech-stack';
  title: string;
  tags: string[];
  content: string;
  relatedTopics?: string[];
}

export const RAG_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  // ── 1. PROJECT OVERVIEW & GENERAL INFO ────────────────────────────────────
  {
    id: 'q1-overview',
    category: 'overview',
    title: 'What is ALT + F4?',
    tags: ['alt+f4', 'alt', 'f4', 'overview', 'about', 'introduction', 'space', 'satellites', '3d', 'project', 'what'],
    content: `ALT + F4 is an advanced, free, open-source 3D Space Situational Awareness (SSA) and Astrodynamics visualization platform designed by Theodore Kruczek. It enables non-engineers, students, researchers, and satellite operators to explore Earth orbit in real-time 3D, simulate orbital breakups, conduct collision analysis, inspect ground sensor coverage, and analyze over 30,000 active and defunct satellites, rocket bodies, and space debris objects using NORAD TLE data and high-precision SGP4/SDP4 orbital propagators.`,
    relatedTopics: ['q2-features', 'q20-sgp4'],
  },
  {
    id: 'q2-features',
    category: 'overview',
    title: 'What are the main features of ALT + F4?',
    tags: ['features', 'capabilities', 'main', 'tools', 'functions', 'what-can-it-do'],
    content: `Main features of ALT + F4:
1. Real-time 3D rendering of 30,000+ satellites, rocket bodies, and space debris.
2. High-speed multi-threaded SGP4/SDP4 orbital propagation via Web Workers.
3. NASA Breakup Model simulations for debris cloud explosion & hypervelocity impacts.
4. Optical and Radar Field-of-View (FOV) sensor coverage cones & look angles.
5. Time Machine with time travel, speed multipliers ($1\\times$ to $86400\\times$), and rewind.
6. Create-Sat plugin for custom orbit builder and TLE editing.
7. Constellation presets (Starlink, GPS, OneWeb, Galileo, GLONASS, Beidou).
8. Keyboard shortcut commands and instant search.`,
    relatedTopics: ['q1-overview', 'q40-breakup', 'q45-fov'],
  },
  {
    id: 'q3-catalog-capacity',
    category: 'overview',
    title: 'How many active satellites and objects orbit Earth?',
    tags: ['capacity', 'satellites', 'satellite', 'active', 'earth', 'count', 'how-many', 'number', 'objects', 'performance', '30000', 'debris'],
    content: `There are currently over 10,000 active operational satellites in Earth orbit. In total, ALT + F4 tracks and renders over 30,000 active satellites, defunct payloads, rocket bodies, and trackable space debris simultaneously in real-time 3D.`,
    relatedTopics: ['q1-overview', 'q20-sgp4'],
  },
  {
    id: 'q4-data-sources',
    category: 'overview',
    title: 'Where does ALT + F4 get its satellite tracking data?',
    tags: ['data-source', 'celestrak', 'space-track', 'norad', 'tle-data', 'origin', 'catalog', 'feed'],
    content: `ALT + F4 ingests official orbital element data from space surveillance feeds including CelesTrak and Space-Track (US Space Force 18th Space Defense Squadron). The Two-Line Element (TLE) catalog updates automatically to ensure accurate satellite position tracking.`,
    relatedTopics: ['q22-tle', 'q36-cospar'],
  },
  {
    id: 'q5-open-source',
    category: 'overview',
    title: 'Is ALT + F4 free and open-source?',
    tags: ['open-source', 'license', 'free', 'agpl', 'github', 'cost'],
    content: `Yes! ALT + F4 is 100% free and open-source software licensed under GNU Affero General Public License v3.0 (AGPL-3.0). Anyone can review the code, build plugins, or host it locally.`,
    relatedTopics: ['q1-overview'],
  },
  {
    id: 'q6-ssa-definition',
    category: 'overview',
    title: 'What is Space Situational Awareness (SSA)?',
    tags: ['ssa', 'space-situational-awareness', 'definition', 'concept', 'monitoring', 'tracking'],
    content: `Space Situational Awareness (SSA) is the knowledge and understanding of space objects, their operational status, trajectories, hazard risks, and environmental conditions in Earth orbit. SSA is essential for preventing satellite collisions, managing orbital debris, and protecting space infrastructure.`,
    relatedTopics: ['q42-collision-screening', 'q45-fov'],
  },
  {
    id: 'q7-norad-id',
    category: 'overview',
    title: 'What is NORAD Catalog Number (SCC ID)?',
    tags: ['norad', 'scc', 'catalog-number', 'id', 'sat-number', 'identifier'],
    content: `The NORAD Catalog Number (also known as Satellite Catalog Number or SCC ID) is a unique 5-digit number assigned by the US Space Command to identify every tracked artificial satellite, rocket body, or piece of debris in Earth orbit. For example, ISS is 25544 and Hubble Space Telescope is 20580.`,
    relatedTopics: ['q22-tle', 'q35-sat-info'],
  },

  // ── 2. 3D GLOBE NAVIGATION & MOUSE CONTROLS ──────────────────────────────
  {
    id: 'q8-mouse-rotate',
    category: 'controls',
    title: 'How do I rotate the 3D Earth view?',
    tags: ['rotate', 'spin', 'turn', 'mouse-left', 'drag', 'globe-movement'],
    content: `To rotate the Earth view, **Left-Click & Drag** (click and hold the left mouse button) anywhere on the 3D scene and drag your mouse in any direction. On touchscreens, swipe with a single finger to rotate.`,
    relatedTopics: ['q9-mouse-pan', 'q10-mouse-zoom'],
  },
  {
    id: 'q9-mouse-pan',
    category: 'controls',
    title: 'How do I pan the camera in space?',
    tags: ['pan', 'translate', 'move-camera', 'right-click-drag', 'shift-left-click'],
    content: `To pan (slide) the camera across space:
- **Right-Click & Drag** anywhere on screen, OR
- Hold **Shift + Left-Click & Drag**.`,
    relatedTopics: ['q8-mouse-rotate', 'q10-mouse-zoom'],
  },
  {
    id: 'q10-mouse-zoom',
    category: 'controls',
    title: 'How do I zoom in and zoom out?',
    tags: ['zoom', 'scroll', 'magnify', 'zoom-in', 'zoom-out', 'mouse-wheel', 'pinch'],
    content: `Use the **Mouse Scroll Wheel** to zoom in towards Earth or zoom out to deep space. On touch devices, use a **two-finger pinch gesture**.`,
    relatedTopics: ['q8-mouse-rotate', 'q9-mouse-pan'],
  },
  {
    id: 'q11-select-satellite',
    category: 'controls',
    title: 'How do I select a satellite on the globe?',
    tags: ['select', 'click-satellite', 'highlight', 'target', 'choose', 'object-info'],
    content: `Simply **Left-Click** on any satellite dot or orbit line in the 3D view. The object will be highlighted with a red/green target ring, its orbit trajectory path will render, and the Satellite Info Box will pop up.`,
    relatedTopics: ['q35-sat-info', 'q12-context-menu'],
  },
  {
    id: 'q12-context-menu',
    category: 'controls',
    title: 'How do I open the Right-Click Context Menu (RMB Menu)?',
    tags: ['right-click', 'rmb', 'context-menu', 'options-menu', 'inspect'],
    content: `**Right-Click** directly on any satellite object to open the Context Menu. This provides quick actions: Center Camera, Plot Orbit, Sim Breakup, Screen Collisions, Copy TLE, and Focus View.`,
    relatedTopics: ['q11-select-satellite', 'q35-sat-info'],
  },
  {
    id: 'q13-reset-camera',
    category: 'controls',
    title: 'How do I reset the camera view to default Earth view?',
    tags: ['reset-camera', 'default-view', 'recenter', 'double-click', 'home-view'],
    content: `To reset camera view back to default centered position:
- **Double-Click** anywhere on empty space, OR
- Press the **Esc** key to deselect object and reset focus.`,
    relatedTopics: ['q8-mouse-rotate', 'q15-earth-centered-view'],
  },
  {
    id: 'q14-follow-satellite',
    category: 'controls',
    title: 'How do I follow a satellite with the camera?',
    tags: ['follow', 'track-satellite', 'lock-camera', 'chase-cam', 'satellite-view'],
    content: `Select a satellite, then click "Focus View" in the Satellite Info Box or Context Menu, or press key **C** to switch camera mode to **Satellite Track View**. The camera will lock onto and move along with the satellite.`,
    relatedTopics: ['q18-sat-track-view', 'q35-sat-info'],
  },

  // ── 3. CAMERA REFERENCE FRAMES & PERSPECTIVES ─────────────────────────────
  {
    id: 'q15-earth-centered-view',
    category: 'camera',
    title: 'What is Earth-Centered View?',
    tags: ['earth-centered', 'geocentric', 'default-mode', 'camera-mode'],
    content: `Earth-Centered View is the default camera perspective in ALT + F4. The camera stays fixed relative to the geocenter (center of Earth) while allowing 360-degree rotation and zoom.`,
    relatedTopics: ['q16-ecef-view', 'q17-eci-view'],
  },
  {
    id: 'q16-ecef-view',
    category: 'camera',
    title: 'What is Fixed Earth View (ECEF)?',
    tags: ['ecef', 'fixed-earth', 'earth-fixed', 'body-fixed', 'rotates-with-earth'],
    content: `Fixed Earth View (ECEF - Earth-Centered, Earth-Fixed) locks the camera grid to Earth's surface rotation. Continents and ground stations stay still, making ground track passes easy to observe.`,
    relatedTopics: ['q15-earth-centered-view', 'q17-eci-view'],
  },
  {
    id: 'q17-eci-view',
    category: 'camera',
    title: 'What is Earth-Centered Inertial View (ECI)?',
    tags: ['eci', 'inertial-view', 'inertial-frame', 'fixed-stars', 'space-fixed'],
    content: `Earth-Centered Inertial (ECI) View fixes the camera relative to distant stars. Earth spins beneath orbital planes, clearly illustrating node regression and orbital plane stability.`,
    relatedTopics: ['q15-earth-centered-view', 'q16-ecef-view'],
  },
  {
    id: 'q18-sat-track-view',
    category: 'camera',
    title: 'What is Satellite Track View?',
    tags: ['satellite-track', 'track-view', 'follow-sat', 'onboard-view', 'chase-view'],
    content: `Satellite Track View attaches the camera to a selected satellite's coordinate frame, providing a chase-cam view as it travels at 7.8+ km/s along its orbit.`,
    relatedTopics: ['q14-follow-satellite', 'q35-sat-info'],
  },
  {
    id: 'q19-sensor-view',
    category: 'camera',
    title: 'What is Ground Sensor View?',
    tags: ['sensor-view', 'ground-station-view', 'radar-site-view', 'telescope-view'],
    content: `Ground Sensor View places the camera at a physical radar or optical ground station site (e.g. Eglin AFB or Fylingdales), looking out into space to observe satellite pass tracks.`,
    relatedTopics: ['q45-fov', 'q47-look-angles'],
  },

  // ── 4. ORBITAL MECHANICS & MATHEMATICAL MODELS ────────────────────────────
  {
    id: 'q20-sgp4',
    category: 'astrodynamics',
    title: 'What is SGP4 (Simplified General Perturbations)?',
    tags: ['sgp4', 'propagator', 'near-earth', 'perturbations', 'math', 'j2', 'drag'],
    content: `SGP4 is the standard analytical orbital propagation model developed by NORAD/US Space Command for Near-Earth space objects (period < 225 min). It calculates position and velocity vectors accounting for Earth oblateness ($J_2, J_3, J_4$), atmospheric drag ($B^*$), and gravitational harmonics.`,
    relatedTopics: ['q21-sdp4', 'q22-tle'],
  },
  {
    id: 'q21-sdp4',
    category: 'astrodynamics',
    title: 'What is SDP4 (Simplified Deep-Space Perturbations)?',
    tags: ['sdp4', 'deep-space', 'lunar-resonance', 'solar-resonance', 'geo-orbits'],
    content: `SDP4 extends SGP4 for Deep-Space objects (period $\\ge$ 225 min, such as GEO, MEO, HEO). It incorporates third-body solar and lunar gravitational perturbations and resonance effects.`,
    relatedTopics: ['q20-sgp4', 'q34-geo-orbit'],
  },
  {
    id: 'q22-tle',
    category: 'astrodynamics',
    title: 'What is a Two-Line Element Set (TLE)?',
    tags: ['tle', 'two-line-element', 'format', 'norad-tle', 'line1', 'line2'],
    content: `A Two-Line Element set (TLE) is a standard 14-parameter data format encoding orbital elements at a specific epoch time.
- Line 1: Catalog ID, classification, launch year, epoch timestamp, $B^*$ drag term.
- Line 2: Inclination ($i$), RAAN ($\\Omega$), Eccentricity ($e$), Arg of Perigee ($\\omega$), Mean Anomaly ($M$), Mean Motion ($n$).`,
    relatedTopics: ['q7-norad-id', 'q23-keplerian-elements'],
  },
  {
    id: 'q23-keplerian-elements',
    category: 'astrodynamics',
    title: 'What are Keplerian Orbital Elements?',
    tags: ['keplerian', 'orbital-elements', '6-elements', 'classical-elements'],
    content: `The 6 Keplerian elements define an orbit's size, shape, and 3D orientation:
1. Semi-major axis ($a$)
2. Eccentricity ($e$)
3. Inclination ($i$)
4. Right Ascension of Ascending Node (RAAN / $\\Omega$)
5. Argument of Perigee ($\\omega$)
6. Mean Anomaly ($M$)`,
    relatedTopics: ['q24-semi-major-axis', 'q25-eccentricity', 'q26-inclination'],
  },
  {
    id: 'q24-semi-major-axis',
    category: 'astrodynamics',
    title: 'What is Semi-Major Axis (a)?',
    tags: ['semi-major-axis', 'orbit-size', 'period-size', 'radius'],
    content: `Semi-major axis ($a$) is half of the longest diameter of the elliptical orbit. It determines the physical size of the orbit and directly defines the orbital period via Kepler's Third Law ($T^2 \\propto a^3$).`,
    relatedTopics: ['q23-keplerian-elements', 'q30-apogee'],
  },
  {
    id: 'q25-eccentricity',
    category: 'astrodynamics',
    title: 'What is Orbital Eccentricity (e)?',
    tags: ['eccentricity', 'shape', 'circular', 'elliptical', 'orbit-shape'],
    content: `Eccentricity ($e$) defines the shape of the orbital ellipse:
- $e = 0$: Perfect circular orbit.
- $0 < e < 1$: Elliptical orbit (e.g. Molniya or GTO orbits).
- $e \\ge 1$: Parabolic / hyperbolic escape trajectory.`,
    relatedTopics: ['q23-keplerian-elements', 'q30-apogee', 'q31-perigee'],
  },
  {
    id: 'q26-inclination',
    category: 'astrodynamics',
    title: 'What is Orbital Inclination (i)?',
    tags: ['inclination', 'tilt', 'equatorial-angle', 'polar-orbit'],
    content: `Inclination ($i$) is the tilt angle between the orbital plane and Earth's equatorial plane:
- $i = 0^\\circ$: Equatorial orbit.
- $i = 90^\\circ$: Polar orbit (passes over North & South poles).
- $i > 90^\\circ$: Retrograde orbit (moves opposite to Earth's rotation).`,
    relatedTopics: ['q23-keplerian-elements', 'q27-raan'],
  },
  {
    id: 'q27-raan',
    category: 'astrodynamics',
    title: 'What is Right Ascension of Ascending Node (RAAN / Ω)?',
    tags: ['raan', 'ascending-node', 'node-longitude', 'vernal-equinox'],
    content: `RAAN ($\\Omega$) is the angle measured eastward along the equator from the Vernal Equinox to the ascending node (the point where the satellite crosses the equator moving northward).`,
    relatedTopics: ['q23-keplerian-elements', 'q28-arg-perigee'],
  },

  // ── 5. ORBIT PARAMETERS & ALTITUDES ───────────────────────────────────────
  {
    id: 'q28-arg-perigee',
    category: 'orbit-types',
    title: 'What is Argument of Perigee (ω)?',
    tags: ['arg-of-perigee', 'argument-perigee', 'closest-point-angle'],
    content: `Argument of Perigee ($\\omega$) is the angle measured in the orbital plane from the ascending node to the perigee (closest approach point to Earth).`,
    relatedTopics: ['q23-keplerian-elements', 'q31-perigee'],
  },
  {
    id: 'q29-mean-anomaly',
    category: 'orbit-types',
    title: 'What is Mean Anomaly (M)?',
    tags: ['mean-anomaly', 'position-in-orbit', 'elapsed-fraction'],
    content: `Mean Anomaly ($M$) is the angular fraction of the orbital period elapsed since perigee passage, expressed as an angle from $0^\\circ$ to $360^\\circ$.`,
    relatedTopics: ['q23-keplerian-elements', 'q31-perigee'],
  },
  {
    id: 'q30-apogee',
    category: 'orbit-types',
    title: 'What is Apogee altitude?',
    tags: ['apogee', 'highest-point', 'maximum-altitude', 'farthest-distance'],
    content: `Apogee is the point in an orbit farthest from the Earth's surface. Apogee altitude is measured in kilometers (km) above sea level.`,
    relatedTopics: ['q31-perigee', 'q24-semi-major-axis'],
  },
  {
    id: 'q31-perigee',
    category: 'orbit-types',
    title: 'What is Perigee altitude?',
    tags: ['perigee', 'lowest-point', 'minimum-altitude', 'closest-distance'],
    content: `Perigee is the point in an orbit closest to the Earth's surface. Perigee altitude is measured in kilometers (km) above sea level.`,
    relatedTopics: ['q30-apogee', 'q24-semi-major-axis'],
  },
  {
    id: 'q32-leo-orbit',
    category: 'orbit-types',
    title: 'What is Low Earth Orbit (LEO)?',
    tags: ['leo', 'low-earth-orbit', 'altitude-160-2000km', 'iss', 'starlink'],
    content: `Low Earth Orbit (LEO) ranges from ~160 km to 2,000 km altitude. LEO satellites (e.g. ISS, Starlink, Hubble) complete an orbit every ~90 to 120 minutes traveling at ~7.8 km/s.`,
    relatedTopics: ['q33-meo-orbit', 'q34-geo-orbit'],
  },
  {
    id: 'q33-meo-orbit',
    category: 'orbit-types',
    title: 'What is Medium Earth Orbit (MEO)?',
    tags: ['meo', 'medium-earth-orbit', 'gps', 'glonass', 'navigation'],
    content: `Medium Earth Orbit (MEO) spans between 2,000 km and 35,786 km altitude. Navigation satellite constellations like GPS (~20,200 km) and Galileo operate in MEO.`,
    relatedTopics: ['q32-leo-orbit', 'q34-geo-orbit'],
  },
  {
    id: 'q34-geo-orbit',
    category: 'orbit-types',
    title: 'What is Geostationary Orbit (GEO)?',
    tags: ['geo', 'geostationary', 'geosynchronous', '35786km', 'telecom'],
    content: `Geostationary Orbit (GEO) is a circular equatorial orbit at 35,786 km altitude. Satellites in GEO match Earth's exact rotational period (23h 56m 4s), appearing stationary over the equator.`,
    relatedTopics: ['q32-leo-orbit', 'q33-meo-orbit'],
  },

  // ── 6. SATELLITE INFO BOX & ANALYTICS ────────────────────────────────────
  {
    id: 'q35-sat-info',
    category: 'sat-info',
    title: 'What information is displayed in the Satellite Info Box?',
    tags: ['sat-info-box', 'satellite-details', 'panel', 'orbit-stats'],
    content: `The Satellite Info Box reveals:
- Object Name, NORAD SCC ID, COSPAR ID, Country/Owner, Launch Date.
- Apogee & Perigee (km), Inclination ($^\\circ$), Period (min), Eccentricity.
- Object Classification (Payload, Rocket Body, Debris) and RCS Size.
- Action triggers: Focus View, Plot Trail, Breakup Sim, Collision Screen, Export TLE.`,
    relatedTopics: ['q11-select-satellite', 'q36-cospar', 'q37-rcs'],
  },
  {
    id: 'q36-cospar',
    category: 'sat-info',
    title: 'What is COSPAR ID / International Designator?',
    tags: ['cospar', 'international-designator', 'launch-id', 'nssdc-id'],
    content: `COSPAR ID (International Designator) is an internationally agreed identifier for space objects formatted as \`YYYY-NNNAAA\` (e.g. \`1998-067A\` for ISS Zarya), indicating launch year and launch number.`,
    relatedTopics: ['q7-norad-id', 'q35-sat-info'],
  },
  {
    id: 'q37-rcs',
    category: 'sat-info',
    title: 'What is Radar Cross Section (RCS)?',
    tags: ['rcs', 'radar-cross-section', 'size', 'small', 'medium', 'large'],
    content: `Radar Cross Section (RCS) is a measure of how detectable a space object is by ground radar. It is categorized in ALT + F4 as SMALL ($< 0.1\\text{ m}^2$), MEDIUM ($0.1 - 1.0\\text{ m}^2$), or LARGE ($> 1.0\\text{ m}^2$).`,
    relatedTopics: ['q35-sat-info', 'q46-radar-cones'],
  },
  {
    id: 'q38-launch-country',
    category: 'sat-info',
    title: 'How do I view satellite launch details and owner country?',
    tags: ['launch-details', 'owner', 'country', 'flag', 'operator'],
    content: `Select any satellite to open the Satellite Info Box. The top header displays the owner nation flag (e.g. USA, PRC, CIS, ESA) along with the launch site and launch date.`,
    relatedTopics: ['q35-sat-info', 'q58-filter-country'],
  },
  {
    id: 'q39-plot-trail',
    category: 'sat-info',
    title: 'How do I plot an object\'s orbit trail?',
    tags: ['plot-trail', 'orbit-line', 'draw-orbit', 'path-line'],
    content: `Click on a satellite, then press **Plot Orbit** in the Satellite Info Box or Context Menu. The full 3D orbital line will draw across its trajectory around Earth.`,
    relatedTopics: ['q11-select-satellite', 'q35-sat-info'],
  },

  // ── 7. BREAKUP SIMULATION & COLLISION ALERT ──────────────────────────────
  {
    id: 'q40-breakup',
    category: 'breakup',
    title: 'How do I simulate a satellite breakup or explosion?',
    tags: ['breakup', 'explosion', 'debris-cloud', 'simulate-breakup', 'nasa-model'],
    content: `1. Select a satellite on the globe.
2. Click **Create Breakup** in the context menu or Breakup Plugin drawer.
3. Configure event parameters using the NASA Breakup Model (Explosion vs Hypervelocity Collision, fragment count).
4. Click **Trigger Breakup**. A spreading debris cloud of hundreds of fragments will generate across orbital planes in real time.`,
    relatedTopics: ['q41-nasa-model', 'q42-collision-screening'],
  },
  {
    id: 'q41-nasa-model',
    category: 'breakup',
    title: 'What is the NASA Breakup Model?',
    tags: ['nasa-breakup-model', 'debris-physics', 'delta-v', 'fragmentation'],
    content: `The NASA Standard Breakup Model is the industry-standard empirical physics model for predicting the fragment count, mass distribution, area-to-mass ratio, and delta-velocity vector distribution of orbital explosions and hypervelocity collisions.`,
    relatedTopics: ['q40-breakup', 'q42-collision-screening'],
  },
  {
    id: 'q42-collision-screening',
    category: 'breakup',
    title: 'How does collision screening work in ALT + F4?',
    tags: ['collision-screening', 'conjunction-assessment', 'miss-distance', 'close-approach'],
    content: `Collision screening computes minimum separation distances between satellites or debris fragments over time windows. The screening tool highlights conjunction pairs where miss distance drops below safe thresholds.`,
    relatedTopics: ['q43-tca', 'q44-iss-screening'],
  },
  {
    id: 'q43-tca',
    category: 'breakup',
    title: 'What is Time of Closest Approach (TCA)?',
    tags: ['tca', 'time-of-closest-approach', 'conjunction-time', 'closest-point'],
    content: `Time of Closest Approach (TCA) is the exact UTC timestamp when two orbiting objects reach their minimum miss distance during a close approach event.`,
    relatedTopics: ['q42-collision-screening', 'q44-iss-screening'],
  },
  {
    id: 'q44-iss-screening',
    category: 'breakup',
    title: 'How do I screen ISS or Tiangong space station for close approaches?',
    tags: ['iss-screening', 'tiangong', 'space-station', 'conjunction-alert'],
    content: `Open the **Collision Alert** menu from the top menu, pick preset targets **ISS (25544)** or **Tiangong (48274)**, and click **Screen Target**. ALT + F4 will analyze all catalog objects for upcoming conjunctions.`,
    relatedTopics: ['q42-collision-screening', 'q43-tca'],
  },

  // ── 8. GROUND SENSORS, RADAR & FOV CONES ─────────────────────────────────
  {
    id: 'q45-fov',
    category: 'sensors',
    title: 'What is Field of View (FOV) coverage?',
    tags: ['fov', 'field-of-view', 'sensor-cone', 'coverage-volume'],
    content: `Field of View (FOV) coverage models the 3D volume of space visible to ground-based radar arrays or optical tracking telescopes. When satellites pass into the cone, detection alerts trigger.`,
    relatedTopics: ['q46-radar-cones', 'q47-look-angles'],
  },
  {
    id: 'q46-radar-cones',
    category: 'sensors',
    title: 'What are Radar and Optical Sensor Cones?',
    tags: ['radar-cones', 'optical-telescope', 'eglin', 'fylingdales', 'geodss'],
    content: `ALT + F4 models iconic space surveillance sensors worldwide (e.g. Eglin Phased Array, Fylingdales, Maui GEODSS). Semi-transparent 3D cones render over ground locations showing exact elevation/azimuth boundaries.`,
    relatedTopics: ['q45-fov', 'q47-look-angles'],
  },
  {
    id: 'q47-look-angles',
    category: 'sensors',
    title: 'What are Ground Station Look Angles (Azimuth, Elevation, Range)?',
    tags: ['look-angles', 'azimuth', 'elevation', 'range', 'range-rate'],
    content: `Look Angles define ground station tracking vectors to a target satellite:
- **Azimuth**: Compass heading angle ($0^\\circ$ to $360^\\circ$).
- **Elevation**: Angle above the local horizon ($0^\\circ$ to $90^\\circ$).
- **Range**: Straight-line distance from ground site to satellite in km.
- **Range Rate**: Doppler radial velocity in km/s.`,
    relatedTopics: ['q45-fov', 'q49-predict-passes'],
  },
  {
    id: 'q48-surveillance-fence',
    category: 'sensors',
    title: 'What is a Surveillance Fence?',
    tags: ['surveillance-fence', 'space-fence', 'radar-fence', 'detection-curtain'],
    content: `A Surveillance Fence (e.g. Kwajalein Space Fence) is an unsteered narrow radar curtain extending across orbital inclination bands to detect uncatalogued objects passing through.`,
    relatedTopics: ['q45-fov', 'q46-radar-cones'],
  },
  {
    id: 'q49-predict-passes',
    category: 'sensors',
    title: 'How do I predict satellite passes over my ground location?',
    tags: ['predict-pass', 'flyover', 'pass-prediction', 'overflight'],
    content: `Select a ground sensor site or set your custom lat/lon location, select target satellites, and open **Pass Predictor**. ALT + F4 will compute upcoming pass start times, max elevation angles, and duration.`,
    relatedTopics: ['q47-look-angles', 'q45-fov'],
  },

  // ── 9. TIME MACHINE, SPEED & DATE JUMP ───────────────────────────────────
  {
    id: 'q50-pause-time',
    category: 'time',
    title: 'How do I pause and resume time in ALT + F4?',
    tags: ['pause', 'resume', 'time-flow', 'spacebar', 'stop-time'],
    content: `Press the **Spacebar** key on your keyboard, or click the **Play/Pause** button on the bottom Time Machine bar to toggle time flow on or off.`,
    relatedTopics: ['q51-speed-multiplier', 'q60-hotkeys'],
  },
  {
    id: 'q51-speed-multiplier',
    category: 'time',
    title: 'How do I speed up or slow down time simulation?',
    tags: ['speed', 'multiplier', 'fast-forward', '10x', '60x', '3600x', 'speed-up'],
    content: `Use the Time Machine slider buttons or press **Up / Down Arrow** keys to change speed multipliers ($1\\times$, $10\\times$, $60\\times = 1\\text{ min/s}$, $3600\\times = 1\\text{ hr/s}$, $86400\\times = 1\\text{ day/s}$).`,
    relatedTopics: ['q50-pause-time', 'q53-rewind-time'],
  },
  {
    id: 'q52-date-picker',
    category: 'time',
    title: 'How do I jump to a specific historical date or launch event?',
    tags: ['date-picker', 'historical-date', 'jump-time', 'calendar-date'],
    content: `Click the **Date/Time Display** on the top or bottom bar to open the calendar date picker. Choose any past or future date/time and click **Jump** to re-propagate satellite orbits at that exact epoch.`,
    relatedTopics: ['q50-pause-time', 'q54-realtime-sync'],
  },
  {
    id: 'q53-rewind-time',
    category: 'time',
    title: 'How do I rewind time in ALT + F4?',
    tags: ['rewind', 'reverse-time', 'negative-speed', 'backward'],
    content: `Click the **Reverse** multiplier button ($-\!1\\times, -\!60\\times, -\!3600\\times$) or press **Left Arrow** to step time backward by 1 minute increments.`,
    relatedTopics: ['q51-speed-multiplier', 'q50-pause-time'],
  },
  {
    id: 'q54-realtime-sync',
    category: 'time',
    title: 'How do I sync back to live real-time UTC?',
    tags: ['realtime-sync', 'now-button', 'live-utc', 'reset-time'],
    content: `Click the **Now** button on the Time Machine control panel to instantly reset simulation time back to real-world live UTC time at $1\\times$ rate.`,
    relatedTopics: ['q50-pause-time', 'q52-date-picker'],
  },

  // ── 10. CUSTOM SATELLITES, FILTERING & EXPORT ────────────────────────────
  {
    id: 'q55-create-sat',
    category: 'custom-sat',
    title: 'How do I create a custom satellite using Create-Sat?',
    tags: ['create-sat', 'custom-satellite', 'shift-c', 'orbit-builder', 'new-satellite'],
    content: `1. Press shortcut **Shift + C** or open **Create-Sat** from top menu.
2. Input custom Keplerian elements ($i, a, e, \\Omega, \\omega, M$) or paste raw TLE text.
3. Set custom satellite name and owner country.
4. Click **Add Satellite**. The new satellite will instantly render and propagate in live 3D space.`,
    relatedTopics: ['q56-edit-tle', 'q23-keplerian-elements'],
  },
  {
    id: 'q56-edit-tle',
    category: 'custom-sat',
    title: 'How do I edit custom TLE data?',
    tags: ['edit-tle', 'modify-orbit', 'change-tle', 'tle-editor'],
    content: `Select a satellite, click **Edit Satellite** in the drawer menu, modify Line 1 or Line 2 numbers, and click **Save Changes**. The orbital propagator will recalculate the orbit immediately.`,
    relatedTopics: ['q55-create-sat', 'q22-tle'],
  },
  {
    id: 'q57-filter-constellations',
    category: 'filters',
    title: 'How do I filter satellites by constellation (Starlink, GPS, etc.)?',
    tags: ['filter-constellation', 'starlink', 'gps', 'oneweb', 'galileo', 'glonass'],
    content: `Open the **Filter Menu** or **Constellations Menu** from the top bar and select presets like Starlink, OneWeb, GPS, GLONASS, Galileo, or Beidou to instantly highlight or isolate that constellation.`,
    relatedTopics: ['q58-filter-country', 'q32-leo-orbit'],
  },
  {
    id: 'q58-filter-country',
    category: 'filters',
    title: 'How do I filter objects by country or payload type?',
    tags: ['filter-country', 'filter-type', 'usa', 'prc', 'cis', 'debris-filter', 'active-only'],
    content: `In the **Filter Menu**, use category dropdowns to select specific countries (USA, China, Russia, ESA, etc.) or object types (Active Payloads, Rocket Bodies, Debris).`,
    relatedTopics: ['q57-filter-constellations', 'q38-launch-country'],
  },
  {
    id: 'q59-export-data',
    category: 'filters',
    title: 'How do I export satellite catalog data or take high-res screenshots?',
    tags: ['export-data', 'screenshot', 'download-tle', 'json-export', 'capture-screen'],
    content: `- **Export TLE/JSON**: Click **Download Data** in the Satellite Info Box or Catalog Browser.
- **High-Res Screenshot**: Click **Screenshot** in the top menu to download a pristine WebGL PNG render of the current view.`,
    relatedTopics: ['q35-sat-info', 'q60-hotkeys'],
  },
  {
    id: 'q60-hotkeys',
    category: 'shortcuts',
    title: 'What are the top keyboard shortcuts in ALT + F4?',
    tags: ['hotkeys', 'keyboard-shortcuts', 'keybinds', 'shortcuts-list', 'cheat-sheet'],
    content: `Top keyboard shortcuts in ALT + F4:
- **\`Space\`**: Pause / Resume time flow.
- **\`Alt + A\`**: Toggle RAG AI Assistant & Voice Chatbot window.
- **\`Shift + F\`**: Open Find Satellite search dialog.
- **\`Shift + C\`**: Open Create Custom Satellite tool.
- **\`Shift + P\`**: Toggle Plugin Drawer.
- **\`C\`**: Cycle Camera Views (Earth-Centered $\\rightarrow$ ECEF $\\rightarrow$ ECI $\\rightarrow$ Sat Track).
- **\`Esc\`**: Deselect current object & reset view.
- **\`Up / Down Arrow\`**: Increase / decrease simulation time speed.
- **\`Left / Right Arrow\`**: Step time backward / forward by 1 minute.`,
    relatedTopics: ['q8-mouse-rotate', 'q50-pause-time', 'q55-create-sat'],
  },

  // ── 11. SOLAR SYSTEM & PLANETS ───────────────────────────────────────────
  {
    id: 'q61-solar-system',
    category: 'overview',
    title: 'Overview of the Solar System and Planets',
    tags: ['solar-system', 'planets', 'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'astronomy'],
    content: `The Solar System consists of our central star, the **Sun**, and 8 major planets in elliptical orbits:
1. **Terrestrial Planets**: Mercury, Venus, Earth, Mars (rocky surfaces).
2. **Gas & Ice Giants**: Jupiter, Saturn, Uranus, Neptune (dense atmospheres, rings, numerous moons).
It also includes dwarf planets (Pluto, Ceres), the Asteroid Belt between Mars and Jupiter, and the icy Kuiper Belt.`,
    relatedTopics: ['q62-mars', 'q63-jupiter', 'q64-saturn'],
  },
  {
    id: 'q62-mars',
    category: 'overview',
    title: 'Facts About Mars (The Red Planet)',
    tags: ['mars', 'red-planet', 'olympus-mons', 'phobos', 'deimos', 'planet'],
    content: `**Mars** is the 4th planet from the Sun, known as the Red Planet due to iron oxide rust on its surface.
- Features **Olympus Mons**, the largest volcano in the Solar System (3x taller than Mt. Everest).
- Has 2 small irregular moons: **Phobos** and **Deimos**.
- Average distance to Sun: ~227.9 million km (1.52 AU).`,
    relatedTopics: ['q61-solar-system', 'q63-jupiter'],
  },
  {
    id: 'q63-jupiter',
    category: 'overview',
    title: 'Facts About Jupiter (Largest Planet)',
    tags: ['jupiter', 'gas-giant', 'great-red-spot', 'ganymede', 'europa', 'io', 'callisto', 'planet'],
    content: `**Jupiter** is the 5th planet and the largest in our Solar System (more than 2.5x the mass of all other planets combined).
- Famous for the **Great Red Spot**, a giant anticyclonic storm larger than Earth.
- Has 95+ moons, including the 4 Galilean moons: **Ganymede** (largest moon), **Europa** (subsurface ocean), **Io** (volcanic), and **Callisto**.`,
    relatedTopics: ['q61-solar-system', 'q64-saturn'],
  },
  {
    id: 'q64-saturn',
    category: 'overview',
    title: 'Facts About Saturn (Ringed Planet)',
    tags: ['saturn', 'rings', 'titan', 'enceladus', 'gas-giant', 'planet'],
    content: `**Saturn** is the 6th planet, renowned for its extensive, brilliant ring system composed of water ice chunks and rock particles.
- Has 140+ moons, including **Titan** (has dense atmosphere and liquid methane lakes) and **Enceladus** (geysers shooting water into space).`,
    relatedTopics: ['q61-solar-system', 'q63-jupiter'],
  },
  {
    id: 'q65-mercury-venus',
    category: 'overview',
    title: 'Facts About Mercury and Venus',
    tags: ['mercury', 'venus', 'inner-planets', 'greenhouse-effect', 'hottest-planet'],
    content: `- **Mercury**: Closest planet to the Sun. Has no atmosphere, resulting in extreme temperature swings from $-180^\\circ\\text{C}$ at night to $430^\\circ\\text{C}$ during the day.
- **Venus**: 2nd planet and hottest in the Solar System ($465^\\circ\\text{C}$) due to a dense carbon dioxide atmosphere producing runaway greenhouse heat.`,
    relatedTopics: ['q61-solar-system', 'q62-mars'],
  },
  {
    id: 'q66-uranus-neptune',
    category: 'overview',
    title: 'Facts About Uranus and Neptune (Ice Giants)',
    tags: ['uranus', 'neptune', 'ice-giants', 'outer-planets', 'methane-atmosphere'],
    content: `- **Uranus**: 7th planet, rotates on its side with an axial tilt of $98^\\circ$. Its methane atmosphere gives it a pale cyan blue color.
- **Neptune**: 8th and farthest major planet, known for vivid deep blue color and supersonic winds exceeding 2,000 km/h.`,
    relatedTopics: ['q61-solar-system', 'q67-pluto-kuiper'],
  },
  {
    id: 'q67-pluto-kuiper',
    category: 'overview',
    title: 'Facts About Pluto and the Kuiper Belt',
    tags: ['pluto', 'kuiper-belt', 'dwarf-planet', 'charon', 'outer-solar-system'],
    content: `**Pluto** was reclassified as a **dwarf planet** in 2006. It resides in the **Kuiper Belt**, a region of icy bodies beyond Neptune's orbit. Pluto has 5 moons, the largest being **Charon**.`,
    relatedTopics: ['q61-solar-system', 'q66-uranus-neptune'],
  },
  {
    id: 'q68-site-navigation',
    category: 'overview',
    title: 'How to Navigate Pages and Menus in ALT + F4',
    tags: ['navigate', 'pages', 'menus', 'switch-page', 'open-drawer', 'top-menu', 'plugin-drawer'],
    content: `Navigation guide for ALT + F4:
1. **Top Menu Bar**: Access Find Satellite, Constellation Filters, Sensor FOVs, Breakup Simulation, Time Machine, and Settings.
2. **Plugin Drawer**: Press **Shift + P** to open the side drawer containing all analytical tools.
3. **Planets / Solar System View**: Open Planets Menu from the top bar to inspect 3D celestial bodies.
4. **Voice Navigation**: Say commands like *"Go to search"*, *"Open breakup"*, or *"Reset camera"* to trigger tools by voice!`,
    relatedTopics: ['q60-hotkeys', 'q2-features'],
  },
];

