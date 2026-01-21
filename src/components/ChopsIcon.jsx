export function ChopsIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer wave */}
      <path
        d="M 340 120 A 180 180 0 1 0 340 392"
        fill="none"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
      />
      {/* Middle wave */}
      <path
        d="M 300 160 A 130 130 0 1 0 300 352"
        fill="none"
        stroke="currentColor"
        strokeWidth="24"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Inner wave */}
      <path
        d="M 265 200 A 80 80 0 1 0 265 312"
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Core wave */}
      <path
        d="M 235 235 A 35 35 0 1 0 235 277"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
