// Wrapper that fades and slides its children up when they scroll into view; `delay` staggers siblings.
import { useInView } from './landingHooks';

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, visible] = useInView({ threshold: 0.15 });
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ '--delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
