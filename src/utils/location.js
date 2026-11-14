/** Runtime guard for persisted location objects (LocalStorage can hold anything). */
export function isLocation(v) {
  return Boolean(
    v &&
      typeof v === 'object' &&
      typeof v.id === 'string' &&
      typeof v.name === 'string' &&
      typeof v.latitude === 'number' &&
      typeof v.longitude === 'number' &&
      Number.isFinite(v.latitude) &&
      Number.isFinite(v.longitude),
  );
}
