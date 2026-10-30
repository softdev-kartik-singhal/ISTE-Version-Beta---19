// White bordered card shell used across every app screen.

export default function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`bg-surface-container-lowest rounded-xl shadow-sm border border-[#E3E8EF] ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
