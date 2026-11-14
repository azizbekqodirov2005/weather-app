import { Share, SquarePlus, Smartphone, Info } from 'lucide-react';
import Sheet from '../Sheet/Sheet';
import { useSettings } from '../../context/SettingsContext';
import { useInstall } from '../../context/InstallContext';

/** Manual install instructions (iOS "Add to Home Screen", or browser menu). */
export default function InstallSheet() {
  const { t } = useSettings();
  const { guideOpen, closeGuide, mode, isIOSSafari } = useInstall();
  if (!guideOpen) return null;

  if (mode === 'ios') {
    const [before, after] = t('install.iosStep1').split('{icon}');
    return (
      <Sheet open onClose={closeGuide} title={t('install.iosTitle')} icon={<SquarePlus size={20} />} closeLabel={t('install.close')}>
        {!isIOSSafari ? (
          <p className="sheet__note">
            <Info size={16} aria-hidden="true" />
            <span>{t('install.iosOtherBrowser')}</span>
          </p>
        ) : null}
        <ol className="sheet__steps">
          <li>
            <span>
              {before}
              <Share size={17} className="sheet__inline-icon" aria-hidden="true" />
              {after}
            </span>
          </li>
          <li>{t('install.iosStep2')}</li>
          <li>{t('install.iosStep3')}</li>
        </ol>
        <div className="sheet__actions">
          <button type="button" className="btn btn--primary" onClick={closeGuide}>
            {t('install.close')}
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={closeGuide} title={t('install.manualTitle')} icon={<Smartphone size={20} />} closeLabel={t('install.close')}>
      <p>{t('install.manualText')}</p>
      <div className="sheet__actions">
        <button type="button" className="btn btn--primary" onClick={closeGuide}>
          {t('install.close')}
        </button>
      </div>
    </Sheet>
  );
}
