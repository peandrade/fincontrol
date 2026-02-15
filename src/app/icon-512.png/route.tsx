import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 290,
          background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 100,
          color: "white",
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        $
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
