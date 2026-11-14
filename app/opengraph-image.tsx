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
        {/* Selo do Tabernáculo com Menorá Vetorial */}
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
          {/* Menorá Sagrada em SVG Puro */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 64 64"
            fill="none"
            style={{ display: "flex" }}
          >
            {/* Base e haste central */}
            <path
              d="M22 52H42M26 48H38M32 20V48"
              stroke="#E2C378"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 3 pares de braços da Menorá */}
            <path
              d="M14 24V28C14 37 22 45 32 45C42 45 50 37 50 28V24"
              stroke="#E2C378"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M20 24V28C20 34 25.4 39 32 39C38.6 39 44 34 44 28V24"
              stroke="#E2C378"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M26 24V28C26 31 28.7 33 32 33C35.3 33 38 31 38 28V24"
              stroke="#E2C378"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* 7 Chamas */}
            <path
              d="M14 15C14 15 16.5 18 16.5 20C16.5 21.4 15.4 22.5 14 22.5C12.6 22.5 11.5 21.4 11.5 20C11.5 18 14 15 14 15Z"
              fill="#F4D576"
            />
            <path
              d="M20 15C20 15 22.5 18 22.5 20C22.5 21.4 21.4 22.5 20 22.5C18.6 22.5 17.5 21.4 17.5 20C17.5 18 20 15 20 15Z"
              fill="#F4D576"
            />
            <path
              d="M26 15C26 15 28.5 18 28.5 20C28.5 21.4 27.4 22.5 26 22.5C24.6 22.5 23.5 21.4 23.5 20C23.5 18 26 15 26 15Z"
              fill="#F4D576"
            />
            <path
              d="M32 12C32 12 35 15.5 35 18C35 19.7 33.7 21 32 21C30.3 21 29 19.7 29 18C29 15.5 32 12 32 12Z"
              fill="#FFE699"
            />
            <path
              d="M38 15C38 15 40.5 18 40.5 20C40.5 21.4 39.4 22.5 38 22.5C36.6 22.5 35.5 21.4 35.5 20C35.5 18 38 15 38 15Z"
              fill="#F4D576"
            />
            <path
              d="M44 15C44 15 46.5 18 46.5 20C46.5 21.4 45.4 22.5 44 22.5C42.6 22.5 41.5 21.4 41.5 20C41.5 18 44 15 44 15Z"
              fill="#F4D576"
            />
            <path
              d="M50 15C50 15 52.5 18 52.5 20C52.5 21.4 51.4 22.5 50 22.5C48.6 22.5 47.5 21.4 50 20C50 18 52.5 15 50 15Z"
              fill="#F4D576"
            />
          </svg>
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

        {/* Badges de Destaque com Ícones Vetoriais SVG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            padding: "16px 32px",
            fontSize: "16px",
            color: "#E2E8F0",
          }}
        >
          {/* Badge 1: Local-First / Shield Lock */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "flex" }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span style={{ fontWeight: 600 }}>100% Local-First (Offline)</span>
          </div>

          <span style={{ color: "rgba(255, 255, 255, 0.25)" }}>•</span>

          {/* Badge 2: Menorá de 7 Chamas */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "flex" }}
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            <span style={{ fontWeight: 600 }}>Menorá de 7 Chamas</span>
          </div>

          <span style={{ color: "rgba(255, 255, 255, 0.25)" }}>•</span>

          {/* Badge 3: Regra dos 4Ps (Target) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "flex" }}
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span style={{ fontWeight: 600 }}>Regra dos 4Ps</span>
          </div>

          <span style={{ color: "rgba(255, 255, 255, 0.25)" }}>•</span>

          {/* Badge 4: Exportação PDF (FileText) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "flex" }}
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <span style={{ fontWeight: 600 }}>Exportação PDF</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
