// Centered full-height page used by Log In and Sign Up.

export default function AuthLayout({ children }) {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-center">
      <main className="w-full bg-surface">
        <div className="flex flex-col w-full items-center justify-center py-10 px-4">{children}</div>
      </main>
    </div>
  );
}
