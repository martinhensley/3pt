export default function FootyBotIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="256" cy="256" r="256" fill="#005031" />

      {/* Shield/Badge Background */}
      <path
        d="M256 80L380 140V260C380 340 256 420 256 420C256 420 132 340 132 260V140L256 80Z"
        fill="#F47322"
      />

      {/* Inner Shield */}
      <path
        d="M256 110L350 160V260C350 325 256 385 256 385C256 385 162 325 162 260V160L256 110Z"
        fill="white"
      />

      {/* FOOTY Text */}
      <text
        x="256"
        y="240"
        fontFamily="Arial, sans-serif"
        fontSize="48"
        fontWeight="bold"
        fill="#005031"
        textAnchor="middle"
      >
        FOOTY
      </text>

      {/* .BOT Text */}
      <text
        x="256"
        y="280"
        fontFamily="Arial, sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill="#F47322"
        textAnchor="middle"
      >
        .BOT
      </text>
    </svg>
  );
}
