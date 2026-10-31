// A rounded rupee amount; hovering (or a screen reader) gives the exact figure.
import { exact, rounded } from '../../utils/money';

export default function Amount({ value, sign = false, className = '' }) {
  return (
    <span className={className} title={`Exact: ${exact(value)}`}>
      {rounded(value, { sign })}
    </span>
  );
}
