// What a page shows instead of its content: loading skeleton, "couldn't load" with Retry,
// "upload your statements" for a new user, or a calm explanation when there is not enough data yet.
import { Link } from 'react-router-dom';

const BOX = 'rounded-xl bg-surface-container-lowest shadow-sm p-space-xl text-center space-y-space-sm';
const BUTTON = 'inline-block h-10 leading-10 px-space-lg rounded-lg bg-primary-container text-on-primary font-label-md text-label-md';

export default function PageState({ state }) {
  let body;
  if (state.status === 'loading') {
    body = (
      <div className="space-y-space-md animate-pulse" aria-label="Loading">
        {[40, 24, 24].map((h, i) => (
          <div key={i} className="rounded-xl bg-surface-container" style={{ height: h * 4 }} />
        ))}
      </div>
    );
  } else if (state.status === 'error') {
    body = (
      <div className={BOX}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Couldn’t load</h2>
        <p className="font-body-md text-body-md text-secondary">{state.error?.message || 'Something went wrong.'}</p>
        <button className={BUTTON} onClick={state.retry}>Retry</button>
      </div>
    );
  } else if (state.status === 'empty') {
    body = (
      <div className={BOX}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Upload your bank statements to get started</h2>
        <p className="font-body-md text-body-md text-secondary">Everything on this page is calculated from the statements you upload. Nothing is shown until then.</p>
        <Link className={BUTTON} to="/statements">Go to Statements</Link>
      </div>
    );
  } else {
    body = (
      <div className={BOX}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">We need a little more data first</h2>
        {(state.messages || []).map((m) => (
          <p key={m} className="font-body-md text-body-md text-secondary">{m}</p>
        ))}
        <Link className={BUTTON} to="/statements">Upload or fix statements</Link>
      </div>
    );
  }
  return (
    <main className="relative pt-16 min-h-screen bg-[#F7F9FC]">
      <div className="max-w-3xl mx-auto p-space-xl">{body}</div>
    </main>
  );
}
