/** "Region, Country" secondary line for a normalized place. */
export function formatPlaceSecondary(place) {
  if (!place) return '';
  return [place.admin1, place.country].filter(Boolean).join(', ');
}
