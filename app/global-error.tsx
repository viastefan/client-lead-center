"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "#07080c",
          color: "#f4f6fb",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 24,
            padding: "40px 32px",
            background: "rgba(16,18,26,0.72)",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>
            Client Lead Center
          </h1>
          <p style={{ marginTop: 12, lineHeight: 1.6, color: "#9aa3b5", fontSize: 14 }}>
            Ein unerwarteter Fehler ist aufgetreten. Die Instanz bleibt online.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              height: 40,
              padding: "0 16px",
              border: 0,
              borderRadius: 12,
              background: "#f4f6fb",
              color: "#0b0c10",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Neu laden
          </button>
        </div>
      </body>
    </html>
  );
}
