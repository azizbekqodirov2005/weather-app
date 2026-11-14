import { useSettings } from '../../context/SettingsContext';
import './Loading.css';

function Block({ h, w, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height: h, width: w }} aria-hidden="true" />;
}

/**
 * Skeleton layout shown while the first forecast for a location loads.
 */
export default function DashboardSkeleton() {
  const { t } = useSettings();
  return (
    <div className="skel" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t('loading.weather')}</span>

      <div className="card skel__hero">
        <div className="skel__row">
          <div className="skel__col">
            <Block h={26} w="48%" />
            <Block h={14} w="30%" />
            <Block h={12} w="40%" />
          </div>
          <Block h={40} w={40} className="skel__circle" />
        </div>
        <div className="skel__row skel__row--main">
          <Block h={96} w={160} />
          <Block h={84} w={84} className="skel__circle" />
        </div>
        <div className="skel__grid-4">
          <Block h={64} />
          <Block h={64} />
          <Block h={64} />
          <Block h={64} />
        </div>
      </div>

      <div className="card skel__card">
        <Block h={18} w="30%" />
        <div className="skel__strip">
          {Array.from({ length: 10 }, (_, i) => (
            <Block key={i} h={110} w={76} />
          ))}
        </div>
      </div>

      <div className="skel__two">
        <div className="card skel__card">
          <Block h={18} w="40%" />
          {Array.from({ length: 7 }, (_, i) => (
            <Block key={i} h={44} />
          ))}
        </div>
        <div className="card skel__card">
          <Block h={18} w="40%" />
          <div className="skel__grid-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Block key={i} h={110} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
