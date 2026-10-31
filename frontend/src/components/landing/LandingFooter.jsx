// Public site footer: logo, tagline, links and copyright.
import logo from '../../../SmartGullak.png';

const LINKS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'security', label: 'Privacy' },
  { id: 'faq', label: 'Terms' },
];

export default function LandingFooter({ onNavigate }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-[16px] font-bold text-[#0b2545]">SmartGullak</span>
          </div>
          <p className="mt-2 text-[14px] text-slate-600">Know if you can afford it, before you spend.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <button key={l.label} type="button" className="text-[14px] text-slate-600 hover:text-[#1d4ed8]" onClick={() => onNavigate(l.id)}>
              {l.label}
            </button>
          ))}
        </nav>
        <p className="text-[13px] text-slate-500">© 2026 SmartGullak</p>
      </div>
    </footer>
  );
}
