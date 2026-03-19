import { ImageResponse } from "next/og";

export const alt = "Vibes Audit — AI-Powered Tone & Vibe Analyzer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          backgroundColor: "#534AB7",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: "-0.02em" }}>
          vibes audit
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.85,
            marginTop: 16,
            maxWidth: 600,
            textAlign: "center",
          }}
        >
          Paste any text. Get its vibe forensically deconstructed by AI.
        </div>
      </div>
    ),
    { ...size }
  );
}
