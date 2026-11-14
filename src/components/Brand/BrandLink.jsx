import { Send } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './BrandLink.css';

export const TELEGRAM_CHANNEL_URL = 'https://t.me/azbekdev';

/**
 * AzbekDev logo linking to the Telegram channel.
 * Both logo variants are rendered; CSS shows the white one on the dark theme and
 * the dark one on the light theme, so switching themes never flashes a wrong logo.
 */
export default function BrandLink({ variant = 'footer' }) {
  const { t } = useSettings();
  return (
    <a
      className={`brand-link brand-link--${variant}`}
      href={TELEGRAM_CHANNEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('brand.madeBy')}: AzbekDev — ${t('brand.channel')}`}
      title={t('brand.channel')}
    >
      <span className="brand-link__label">{t('brand.madeBy')}</span>
      <span className="brand-link__logo">
        <img className="brand-link__img brand-link__img--on-dark" src="/brand/azbekdev-logo-white.png" alt="" width="546" height="128" loading="lazy" decoding="async" />
        <img className="brand-link__img brand-link__img--on-light" src="/brand/azbekdev-logo-dark.png" alt="" width="546" height="128" loading="lazy" decoding="async" />
      </span>
      <span className="brand-link__tg">
        <Send size={14} aria-hidden="true" /> {t('brand.channel')}
      </span>
    </a>
  );
}
