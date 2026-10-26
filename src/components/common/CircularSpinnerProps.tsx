import React from 'react';

interface CircularSpinnerProps {
	size?: number;
	color?: string;
	speed?: string;
	bgOpacity?: number;
	className?: string;
}

const CircularSpinner: React.FC<CircularSpinnerProps> = ({
	size = 40,
	color = 'white',
	speed = '0.8s',
	bgOpacity = 0.1,
	className = '',
}) => {
	// Define the styles as React inline styles
	const containerStyle: React.CSSProperties = {
		height: `${size}px`,
		width: `${size}px`,
		transformOrigin: 'center',
		animation: `rotate ${speed} linear infinite`,
		willChange: 'transform',
		overflow: 'visible',
	};

	const carStyle: React.CSSProperties = {
		fill: 'none',
		stroke: color,
		strokeDasharray: '25, 75',
		strokeDashoffset: 0,
		strokeLinecap: 'round',
		transition: 'stroke 0.5s ease',
	};

	const trackStyle: React.CSSProperties = {
		fill: 'none',
		stroke: color,
		opacity: bgOpacity,
		transition: 'stroke 0.5s ease',
	};

	// Define the keyframes animation
	const keyframes = `
    @keyframes rotate {
      100% {
        transform: rotate(360deg);
      }
    }
  `;

	return (
		<>
			<style>{keyframes}</style>
			<svg
				className={className}
				viewBox="0 0 40 40"
				height={size}
				width={size}
				style={containerStyle}
			>
				<circle
					cx="20"
					cy="20"
					r="17.5"
					pathLength="100"
					strokeWidth="5px"
					style={trackStyle}
				/>
				<circle
					cx="20"
					cy="20"
					r="17.5"
					pathLength="100"
					strokeWidth="5px"
					style={carStyle}
				/>
			</svg>
		</>
	);
};

export default CircularSpinner;
