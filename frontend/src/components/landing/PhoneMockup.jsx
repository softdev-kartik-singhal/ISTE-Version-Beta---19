// The landing page's signature phone: an HTML/CSS smartphone on the right whose screen follows the section in view.
// Screens are static components with fixed sample data. Each one remounts when it becomes active, so its animation replays.
import { useEffect, useRef, useState } from 'react';
import AskScreen from './phone/AskScreen';
import UploadScreen from './phone/UploadScreen';
import HomeScreen from './phone/HomeScreen';
import PlanScreen from './phone/PlanScreen';
import CardScreen from './phone/CardScreen';
import { useReducedMotion } from './landingHooks';

const SCREENS = { ask: AskScreen, upload: UploadScreen, home: HomeScreen, plan: PlanScreen, card: CardScreen };
const LABELS = { ask: 'Ask: can I afford it', upload: 'Uploading statements', home: 'Home', plan: 'Plan', card: 'Confirm with your card' };

// screen: key of SCREENS to show; hidden: fade the docked phone out (sections after Security)
export default function PhoneMockup({ screen, hidden }) {
  const reduced = useReducedMotion();
  // Keep the previous screen mounted while it fades out, so the cross-fade never shows an empty screen.
  const [leaving, setLeaving] = useState(null);
  const current = useRef(screen);
  useEffect(() => {
    if (current.current === screen) return undefined;
    setLeaving(current.current);
    current.current = screen;
    const t = setTimeout(() => setLeaving(null), 450);
    return () => clearTimeout(t);
  }, [screen]);
  return (
    <div className={`phone-dock ${hidden ? 'is-hidden' : ''}`} role="img" aria-label={`Phone preview with sample data: ${LABELS[screen]}`}>
      <div className="phone-tilt">
        <div className={reduced ? '' : 'phone-float'}>
          <div className="phone-body">
            {/* side buttons */}
            <span className="phone-btn" style={{ left: -3, top: '18%', height: 36 }} />
            <span className="phone-btn" style={{ left: -3, top: '27%', height: 56 }} />
            <span className="phone-btn" style={{ right: -3, top: '24%', height: 72 }} />
            <div className="phone-screen">
              <div className="phone-island" />
              <span className="absolute top-3 left-6 text-[11px] font-semibold text-slate-900 z-[7]">9:41</span>
              {Object.entries(SCREENS).map(([key, Screen]) => (
                <div key={key} className={`phone-view ${screen === key ? 'is-active' : ''}`} aria-hidden={screen !== key}>
                  {(screen === key || leaving === key) && <Screen />}
                </div>
              ))}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[7] px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-[9px] font-medium tracking-wide">
                Sample data
              </span>
              <div className="phone-glass" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
