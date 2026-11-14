import { CloudSun, ExternalLink } from 'lucide-react';
import BrandLink from '../Brand/BrandLink';
import { useSettings } from '../../context/SettingsContext';
import './Footer.css';

const LINKS = [
  { key: 'dataBy', label: 'Open-Meteo', href: 'https://open-meteo.com/' },
  { key: 'geocodingBy', label: 'Open-Meteo Geocoding', href: 'https://open-meteo.com/en/docs/geocoding-api' },
  { key: 'reverseBy', label: 'OSM Nominatim', href: 'https://nominatim.org/' },
  { key: 'mapBy', label: 'OpenStreetMap + Leaflet', href: 'https://www.openstreetmap.org/copyright' },
];

export default function Footer() {
  const { t } = useSettings();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <BrandLink variant="footer" />
          <div className="footer__meta">
            <div className="footer__brand">
              <CloudSun size={18} aria-hidden="true" />
              <span>
                {t('app.name')} · {t('footer.builtWith')}
              </span>
            </div>
            <ul className="footer__links">
              {LINKS.map((l) => (
                <li key={l.key}>
                  <span className="footer__label">{t(`footer.${l.key}`)}:</span>{' '}
                  <a href={l.href} target="_blank" rel="noreferrer noopener">
                    {l.label} <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="footer__license">{t('footer.license')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
