export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 safe-area-inset">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
