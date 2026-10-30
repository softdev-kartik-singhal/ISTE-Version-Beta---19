// Small pill toggle group (e.g. "Prev Month | 3-Mo Average"); the selected option gets a raised white chip.

export default function SegmentedToggle({ options, value, onChange, activeTextClass = 'text-on-surface', padClass = 'px-3' }) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-surface-container-high">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              active
                ? `${padClass} py-1.5 rounded-md bg-surface-container-lowest ${activeTextClass} font-semibold shadow-sm text-label-md transition-all`
                : `${padClass} py-1.5 rounded-md font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-all`
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
