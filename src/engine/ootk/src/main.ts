import * as ootkDist from '../dist/main.js';
export * from '../dist/main.js';

export class Sgp4Wasm {
  load(_opts?: { glue?: string; wasm?: string }): Promise<any> {
    return Promise.reject(new Error('Sgp4Wasm is not available in OSS build'));
  }
}

export class Sgp4XpWasm extends Sgp4Wasm {}

export class TtcAntenna extends (ootkDist.Sensor || Object) {
  constructor(params: any = {}) {
    super(params);
    Object.assign(this, params);
  }
}

export class LaunchWindowFinder {
  findWindows(..._args: any[]): any[] {
    return [];
  }
}

export type LaunchWindowResult = any;

export function semimajorAxisFromMeanMotion(meanMotion: number): number {
  const n = (meanMotion * 2 * Math.PI) / 86400;
  const mu = 398600.4418;
  return Math.cbrt(mu / (n * n));
}

export function groundTrackStateVector(params: {
  semimajorAxisKm: number;
  eccentricity: number;
  inclinationRad: number;
  latRad: number;
  lonRad: number;
  gmstRad: number;
  direction?: 'N' | 'S';
}): { position: { x: number; y: number; z: number }; velocity: { x: number; y: number; z: number } } | null {
  const { semimajorAxisKm: a, eccentricity: e, inclinationRad: inc, latRad: lat, lonRad: lon, gmstRad: gmst, direction } = params;
  if (Math.abs(lat) > Math.abs(inc) + 1e-4) {
    return null;
  }
  const mu = 398600.4418;
  const rMag = a * (1 - e * e); // circular / perigee radius approximation
  const theta = lon + gmst;
  const cosLat = Math.max(1e-6, Math.cos(lat));
  const sinLat = Math.sin(lat);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const pos = {
    x: rMag * cosLat * cosTheta,
    y: rMag * cosLat * sinTheta,
    z: rMag * sinLat,
  };

  const vMag = Math.sqrt(mu / a);
  const cosInc = Math.cos(inc);
  const sinBetaVal = Math.max(-1, Math.min(1, cosInc / cosLat));
  let beta = Math.asin(sinBetaVal);
  if (direction === 'S') {
    beta = Math.PI - beta;
  }

  // East and North unit vectors in ECI
  const east = { x: -sinTheta, y: cosTheta, z: 0 };
  const north = { x: -sinLat * cosTheta, y: -sinLat * sinTheta, z: cosLat };

  const sinBeta = Math.sin(beta);
  const cosBeta = Math.cos(beta);

  const vel = {
    x: vMag * (sinBeta * east.x + cosBeta * north.x),
    y: vMag * (sinBeta * east.y + cosBeta * north.y),
    z: vMag * (sinBeta * east.z + cosBeta * north.z),
  };

  return { position: pos, velocity: vel };
}
