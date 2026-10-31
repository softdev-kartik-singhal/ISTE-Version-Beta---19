// The single "what to do next" button on an insight, flag summary or warning: opens a page with a filter already applied.
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// action = { label, to, state }  (state is the route state the target page reads as its filter)
export default function NextActionButton({ action }) {
  return (
    <Link
      to={action.to}
      state={action.state}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
    >
      <span>{action.label}</span>
      <ArrowRight size={14} />
    </Link>
  );
}
