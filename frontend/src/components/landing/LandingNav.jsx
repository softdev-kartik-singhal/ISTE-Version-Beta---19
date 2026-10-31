// Public site header: logo, section links, Log in and Get started. Transparent at the top, white with a shadow once scrolled.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../../SmartGullak.png';

const LINKS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'security', label: 'Privacy' },
];

export default function LandingNav({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function go(id) {
    setMenuOpen(false);
    onNavigate(id);
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled || menuOpen ? 'bg-white/95 backdrop-blur shadow-[0_2px_16px_rgba(11,37,69,0.08)]' : 'bg-transparent'}`}>
      <nav className="h-16 max-w-7xl mx-auto px-5 lg:px-10 flex items-center justify-between" aria-label="Main">
        <button type="button" className="flex items-center gap-2" onClick={() => go('top')} aria-label="SmartGullak, back to top">
          <img src={logo} alt="" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-[17px] font-bold tracking-tight text-[#0b2545]">SmartGullak</span>
        </button>
        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <button key={l.id} type="button" className="text-[14px] font-medium text-slate-700 hover:text-[#1d4ed8] transition-colors" onClick={() => go(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex px-3 py-2 text-[14px] font-semibold text-[#0b2545] hover:text-[#1d4ed8]">
            Log in
          </Link>
          <Link to="/signup" className="lift inline-flex px-4 py-2 rounded-xl bg-[#1d4ed8] text-white text-[14px] font-semibold shadow-md shadow-blue-600/25 hover:bg-[#1e40af]">
            Get started
          </Link>
          <button type="button" className="md:hidden p-2 rounded-lg text-[#0b2545]" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="md:hidden px-5 pb-4 flex flex-col gap-1 bg-white">
          {LINKS.map((l) => (
            <button key={l.id} type="button" className="text-left py-2.5 text-[15px] font-medium text-slate-800" onClick={() => go(l.id)}>
              {l.label}
            </button>
          ))}
          <Link to="/login" className="py-2.5 text-[15px] font-semibold text-[#0b2545]">Log in</Link>
        </div>
      )}
    </header>
  );
}
