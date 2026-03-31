export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">iBidDZ</h1>
          <p className="text-gray-500 dark:text-gray-400">Algeria's Trusted iPhone Marketplace</p>
        </div>
        {children}
      </div>
    </div>
  );
}
