// SmartGullak logo shown on the Log In card (the image in src/assets, trimmed to its rounded tile).
import logo from '../../assets/smartgullak-logo.png';

export default function GullakLogo() {
  return <img src={logo} alt="SmartGullak" width="56" height="56" className="w-14 h-14 rounded-xl mb-4 shadow-sm" />;
}
