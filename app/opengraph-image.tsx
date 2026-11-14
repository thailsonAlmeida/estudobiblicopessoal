import { ImageResponse } from "next/og";

export const alt = "Estudo Bíblico Pessoal — 12 Métodos de Rick Warren";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 25%, #1B2A4A 0%, #0F172A 70%, #090D16 100%)",
          padding: "48px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#FDFBF7",
          position: "relative",
          boxSizing: "border-box",
          border: "8px solid #C5A059",
        }}
      >
        {/* Selo do Tabernáculo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "rgba(197, 160, 89, 0.15)",
            border: "1.5px solid rgba(197, 160, 89, 0.5)",
            padding: "8px 24px",
            borderRadius: "999px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🕯️</span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#E2C378",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Jornada do Tabernáculo
          </span>
        </div>

        {/* Título Principal */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: "16px",
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
          }}
        >
          Estudo Bíblico Pessoal
        </div>

        {/* Subtítulo Inspirador */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: 600,
            color: "#C5A059",
            textAlign: "center",
            maxWidth: "980px",
            marginBottom: "36px",
            lineHeight: 1.4,
          }}
        >
          12 Métodos Práticos de Rick Warren • Do Átrio ao Santo dos Santos
        </div>

        {/* Badges de Destaque */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            padding: "14px 32px",
            fontSize: "17px",
            color: "#E2E8F0",
          }}
        >
          <span style={{ fontWeight: 600 }}>🔒 100% Local-First (Offline)</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
          <span style={{ fontWeight: 600 }}>🔥 Menorá de 7 Chamas</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
          <span style={{ fontWeight: 600 }}>🎯 Regra dos 4Ps</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
          <span style={{ fontWeight: 600 }}>📄 Exportação PDF</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

