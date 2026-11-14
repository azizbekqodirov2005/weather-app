import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Map as MapIcon, Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useSettings } from '../../context/SettingsContext';
import './WeatherMap.css';

const DEFAULT_ZOOM = 10;

/** A CSS-drawn marker: avoids the classic "missing marker image" bundler problem. */
const markerIcon = L.divIcon({
  className: 'map-marker',
  html: '<span class="map-marker__ring"></span><span class="map-marker__dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/** Keeps the map centred on the selected location with a smooth fly-to. */
function Recenter({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), DEFAULT_ZOOM), { duration: 0.8 });
  }, [map, latitude, longitude]);
  return null;
}

function formatCoord(value, posSuffix, negSuffix) {
  const abs = Math.abs(value).toFixed(4);
  return `${abs}° ${value >= 0 ? posSuffix : negSuffix}`;
}

/**
 * Interactive OpenStreetMap map (Leaflet) with a marker on the selected city.
 * No fake weather layers are drawn – only real base tiles.
 */
export default function WeatherMap({ location, theme }) {
  const { t } = useSettings();
  const center = useMemo(() => [location.latitude, location.longitude], [location.latitude, location.longitude]);

  return (
    <section className="card fade-in" aria-labelledby="map-title">
      <div className="card__header">
        <h2 id="map-title" className="card__title">
          <MapIcon size={18} aria-hidden="true" /> {t('map.title')}
        </h2>
        <span className="card__subtitle map__coords">
          <Crosshair size={14} aria-hidden="true" />
          <span className="sr-only">{t('map.coordinates')}: </span>
          {formatCoord(location.latitude, 'N', 'S')}, {formatCoord(location.longitude, 'E', 'W')}
        </span>
      </div>
      <div className="card__body">
        <div className={`map map--${theme}`}>
          <MapContainer
            center={center}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            className="map__canvas"
            aria-label={t('map.marker', { name: location.name })}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <Marker position={center} icon={markerIcon} alt={t('map.marker', { name: location.name })}>
              <Popup>
                <strong>{location.name}</strong>
                {location.country ? <div>{location.country}</div> : null}
                <div className="map__popup-coords">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </div>
              </Popup>
            </Marker>
            <Recenter latitude={location.latitude} longitude={location.longitude} />
          </MapContainer>
        </div>
      </div>
    </section>
  );
}
