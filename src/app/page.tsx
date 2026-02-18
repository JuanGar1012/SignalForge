import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>SignalForge</h1>
      <p>Slice 1 scaffold is live: auth, protected route, and health checks.</p>
      <div className="card">
        <h2>Quick Demo</h2>
        <ol>
          <li>Open login page and sign in with demo credentials.</li>
          <li>Open dashboard to confirm protected server render.</li>
          <li>Hit health and auth session endpoints.</li>
        </ol>
        <div className="row">
          <Link href="/login">Login</Link>
          <Link href="/dashboard">Dashboard</Link>
          <a href="/api/health">API Health</a>
          <a href="/api/auth/session">Session</a>
        </div>
      </div>
    </main>
  );
}
