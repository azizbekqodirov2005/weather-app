import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './Install.css';

function subscribe(cb) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}
const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

/** Visible while the device has no network connection. */
export default function OfflineBanner() {
  const { t } = useSettings();
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={18} aria-hidden="true" />
      <span>{t('network.offline')}</span>
    </div>
  );
}
