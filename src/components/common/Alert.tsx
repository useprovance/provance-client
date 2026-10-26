import React, { forwardRef } from 'react';

export interface IconProps extends React.SVGAttributes<SVGElement> {
	color?: string;
	size?: string | number;
	strokeWidth?: string | number;
	absoluteStrokeWidth?: boolean;
	className?: string;
	children?: React.ReactNode;
}

export type Icon = React.ForwardRefExoticComponent<
	IconProps & React.RefAttributes<SVGSVGElement>
>;

const Alert: Icon = forwardRef<SVGSVGElement, IconProps>(
	(
		{
			color = 'currentColor',
			size = 24,
			strokeWidth = 2,
			absoluteStrokeWidth = false,
			className = '',
			children,
			...rest
		},
		ref
	) => {
		return (
			<svg
				ref={ref}
				xmlns="http://www.w3.org/2000/svg"
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				stroke={color}
				strokeWidth={
					absoluteStrokeWidth
						? (Number(strokeWidth) * 24) / Number(size)
						: strokeWidth
				}
				strokeLinecap="round"
				strokeLinejoin="round"
				className={className}
				{...rest}
			>
				<path d="M12 5V15M12 19H12.01" />
				{children}
			</svg>
		);
	}
);

Alert.displayName = 'Alert';

export { Alert };
