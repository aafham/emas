import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #111111, #2b2b2b)",
          color: "#D4AF37",
          fontSize: 200,
          fontWeight: 700,
        }}
      >
        E
      </div>
    ),
    size,
  );
}
