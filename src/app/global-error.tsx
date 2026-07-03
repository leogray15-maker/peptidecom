"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#07070a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
            <p style={{ color: "#94a3b8", marginTop: 12, fontSize: 14 }}>
              A critical error occurred. Please try again.
            </p>
            {error.digest && (
              <p style={{ color: "#475569", marginTop: 8, fontSize: 12 }}>Reference: {error.digest}</p>
            )}
            <button
              onClick={reset}
              style={{ marginTop: 24, background: "#7c5cff", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
