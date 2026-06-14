import { ImageResponse } from 'next/og';

// Image metadata for Next.js App Router icon generator
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          borderRadius: '8px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        T
      </div>
    ),
    {
      ...size,
    }
  );
}
