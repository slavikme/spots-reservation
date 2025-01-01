// File: app/page.tsx
"use client";

import { useUser } from "@/providers/UserProvider";

export default function Home() {
  const { auth0User, error, isLoading } = useUser();

  if (error) {
    return <div>{error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen">
      {/* Main Content */}
      <div className="p-24">
        {!auth0User && (
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/api/auth/login"
            className="text-blue-500 hover:text-blue-700"
          >
            Login
          </a>
        )}
      </div>
    </main>
  );
}
