import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "MuktaVidya AI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0b",
          backgroundImage:
            "linear-gradient(to bottom right, #0a0a0b 0%, #151518 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          {/* Main Logo / Title */}
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
            }}
          >
            MuktaVidya AI
          </div>

          {/* Subtitle / Description */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 400,
              color: "#a1a1aa", // text-secondary
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            Instant, AI-powered solutions to your toughest questions.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
