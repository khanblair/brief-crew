export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand">BriefCrew</h1>
          <p className="text-sm text-neutral-500 mt-1">The Agentic Freelancer System</p>
        </div>
        {children}
      </div>
    </main>
  );
}
