// SmartGullak "vault gullak" mark used on the auth cards (custom SVG from the design).

export default function GullakLogo() {
  return (
    <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4 shadow-sm">
      <svg className="w-8 h-8 fill-current text-primary" viewBox="0 0 24 24">
        <path d="M19 8h-2.18c-.42-2.31-2.43-4-4.82-4-.86 0-1.66.24-2.36.65L9.64 4.65C9.25 4.26 8.62 4.26 8.23 4.65c-.39.39-.39 1.02 0 1.41l.74.74C7.75 7.85 7 9.33 7 11c0 1.02.29 1.97.79 2.78L4.29 17.29a.996.996 0 101.41 1.41l2.87-2.87C9.64 16.52 10.78 17 12 17c2.39 0 4.4-1.69 4.82-4H19c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-7-2c1.65 0 3 1.35 3 3H9c0-1.65 1.35-3 3-3zm0 9c-2.21 0-4-1.79-4-4 0-.58.13-1.12.35-1.62l1.66 1.66c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L9.76 8.97c.64-.61 1.49-.97 2.24-.97 2.21 0 4 1.79 4 4s-1.79 4-4 4z" />
      </svg>
    </div>
  );
}
