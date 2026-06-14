export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/svg+xml';

export default function Icon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#grad)" />
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="18" font-family="sans-serif" font-weight="800">T</text>
    </svg>
  `;

  return new Response(svg.trim(), {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });
}
