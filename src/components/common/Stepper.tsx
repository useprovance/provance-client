import React from 'react';
import { cn } from '@/lib/utils';

interface StepperProps {
	currentStep: number;
	totalSteps: number;
	onStepClick?: (step: number) => void;
	disabledSteps?: number[];
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'rounded' | 'pills';
	clickableSteps?: boolean;
}

const Stepper: React.FC<StepperProps> = ({
	currentStep,
	totalSteps,
	onStepClick,
	disabledSteps = [],
	className = '',
	size = 'md',
	variant = 'pills',
	clickableSteps = true,
}) => {
	const sizeClasses = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3',
	};

	const widthClasses = {
		sm: 'w-8',
		md: 'w-12',
		lg: 'w-16',
	};

	const gapClasses = {
		sm: 'gap-1',
		md: 'gap-2',
		lg: 'gap-3',
	};

	const radiusClasses = {
		default: '',
		rounded: 'rounded',
		pills: 'rounded-full',
	};

	const handleStepClick = (stepNumber: number) => {
		if (
			clickableSteps &&
			onStepClick &&
			!disabledSteps.includes(stepNumber)
		) {
			onStepClick(stepNumber);
		}
	};

	return (
		<div className={cn('flex items-center', gapClasses[size], className)}>
			{Array.from({ length: totalSteps }, (_, index) => {
				const stepNumber = index + 1;
				const isActive = stepNumber <= currentStep;
				const isDisabled = disabledSteps.includes(stepNumber);
				const isClickable = clickableSteps && onStepClick && !isDisabled;

				const StepElement = isClickable ? 'button' : 'div';

				return (
					<StepElement
						key={stepNumber}
						onClick={() => handleStepClick(stepNumber)}
						disabled={isDisabled}
						className={cn(
							'transition-all duration-300',
							sizeClasses[size],
							widthClasses[size],
							radiusClasses[variant],
							isActive ? 'bg-blue-600' : 'bg-gray-300',
							isClickable && [
								'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
								!isActive && 'hover:bg-gray-400',
							],
							isDisabled && 'cursor-not-allowed opacity-50'
						)}
						role="progressbar"
						aria-valuenow={currentStep}
						aria-valuemin={1}
						aria-valuemax={totalSteps}
						aria-label={`Step ${stepNumber} of ${totalSteps}${
							isClickable ? ', click to navigate' : ''
						}`}
						title={isClickable ? `Go to step ${stepNumber}` : undefined}
					/>
				);
			})}
		</div>
	);
};
export default Stepper;
