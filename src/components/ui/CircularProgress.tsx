import { HTMLAttributes } from "react";

interface CircularProgressProps extends HTMLAttributes<SVGElement> {
	percentage: number;
	size?: number;
	strokeWidth?: number;
	color?: string;
}

export function CircularProgress({
	percentage,
	size = 40,
	strokeWidth = 4,
	color = "#2563EB",
	...props
}: CircularProgressProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			{...props}
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="text-foreground/10"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke={color}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				className="transition-all duration-300 ease-out"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
			/>
		</svg>
	);
}
