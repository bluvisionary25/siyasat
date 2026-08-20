import React from 'react';

const SiyasatLogo = ({ variant = 'maroon', size = 'md', className = '' }) => {
  const isWhite = variant === 'white';
  const textColor = isWhite ? '#FFFFFF' : '#800000';
  const glassColor = isWhite ? '#FFFFFF' : '#800000';

  // Size styling map
  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-14',
    xl: 'h-24'
  };

  const currentHeight = heightClasses[size] || 'h-9';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 450 110"
        className={`${currentHeight} w-auto overflow-visible`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          {/* LETTER S */}
          <text
            x="0"
            y="90"
            fill={textColor}
            fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif"
            fontWeight="900"
            fontSize="98"
            letterSpacing="-3"
          >
            S
          </text>

          {/* LOWERCASE i STEM */}
          <rect
            x="68"
            y="44"
            width="17"
            height="46"
            rx="1.5"
            fill={textColor}
          />

          {/* MAGNIFYING GLASS ICON (REPLACING THE DOT OF i) */}
          <g transform="translate(44, 2)">
            {/* LENS RING */}
            <circle
              cx="26"
              cy="24"
              r="17"
              stroke={glassColor}
              strokeWidth="7"
              fill="none"
            />
            {/* LENS INNER LIGHT SHINE */}
            <path
              d="M 16 20 A 11 11 0 0 1 26 13"
              stroke={isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* HANDLE EXTENDING DOWNWARD RIGHT */}
            <rect
              x="36"
              y="34"
              width="8.5"
              height="30"
              rx="4"
              fill={glassColor}
              transform="rotate(-42 36 34)"
            />
          </g>

          {/* LETTERS YASAT */}
          <text
            x="100"
            y="90"
            fill={textColor}
            fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif"
            fontWeight="900"
            fontSize="98"
            letterSpacing="-2"
          >
            YASAT
          </text>
        </g>
      </svg>
    </div>
  );
};

export default SiyasatLogo;
