import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AiPlayground } from "@/components/ai-playground";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  return (
    <main>
      <div className="card">
        <h1>Dashboard</h1>
        <p>Authenticated user: {session.email}</p>
        <p>Role: {session.role}</p>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="secondary">
            Sign out
          </button>
        </form>
      </div>
      <div className="card">
        <h2>Protected API Check</h2>
        <p>
          Try <a href="/api/protected/ping">/api/protected/ping</a> while authenticated.
        </p>
      </div>
      <AiPlayground />
    </main>
  );
}
