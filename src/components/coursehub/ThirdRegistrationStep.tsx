import { useState } from 'react';

import { Fragment } from 'react/jsx-runtime';

import { cn } from '@/lib/utils';
import { BookDashed } from 'lucide-react';

type LoanType = 'personal' | 'unregistered' | 'registered';

interface LoanOption {
	id: LoanType;
	title: string;
	description: string;
	icon: React.ReactNode;
	link: string;
}

function ThirdRegistrationStep() {
	const [selectedType, setSelectedType] = useState<LoanOption | null>(null);
	const loanOptions: LoanOption[] = [
		{
			id: 'personal',
			title: 'Personal/Individual Loan',
			description: 'Apply as an individual or freelancer',
			link: '/dashboard/personal/apply',
			icon: <BookDashed className="w-12 h-12" />,
		},
		{
			id: 'unregistered',
			title: 'Unregistered Business',
			description: 'Apply as informal business (not registered with CAC)',
			link: '/dashboard/unregistered/apply',
			icon: <BookDashed className="w-12 h-12" />,
		},
		{
			id: 'registered',
			title: 'Registered Business',
			description:
				'Apply as a CAC Registered Business (Nano, Microenterprise, or SME) as a Limited Liability or as a Business Name',
			link: '/dashboard/registered/apply',
			icon: <BookDashed className="w-12 h-12" />,
		},
	];

	const handleOptionSelect = (index: number) => {
		const loanOption = loanOptions[index];
		setSelectedType(loanOption);
	};

	return (
		<Fragment>
			<div className="mt-20 ">
				<h1 className="font-semibold text-3xl font-jakarta">
					Tell us who your are applying as ?
				</h1>
				<p className="text-gray-500 font-jakarta mt-4">
					To give your the best experience and request only the documents
					that matter, we need to know what kind of applicant you are.
				</p>
			</div>
			<form className="mt-8 space-y-8 b ">
				<div className=" space-y-4">
					{loanOptions.map((option, i) => (
						<div
							key={option.id}
							onClick={() => handleOptionSelect(i)}
							className={cn(
								'flex items-center gap-4 p-6 rounded-md border-2 cursor-pointer transition-all duration-200',
								selectedType?.id === option.id
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
							)}
						>
							{/* Icon */}
							<div
								className={cn(
									'flex-shrink-0 transition-colors duration-200 hidden md:block ',
									selectedType?.id === option.id
										? 'text-blue-600'
										: 'text-gray-600'
								)}
							>
								{option.icon}
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<h3
									className={cn(
										'text-md font-manrope font-semibold text-gray-700 ',
										selectedType?.id === option.id
											? 'text-blue-600'
											: 'text-gray-700'
									)}
								>
									{option.title}
								</h3>
								<p className="text-gray-500 text-sm leading-relaxed">
									{option.description}
								</p>
							</div>

							{/* Radio Button */}
							<div className="flex-shrink-0">
								<div
									className={cn(
										'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
										selectedType?.id === option.id
											? 'border-blue-500 bg-blue-500'
											: 'border-gray-300 bg-white'
									)}
								>
									{selectedType?.id === option.id && (
										<div className="w-2 h-2 bg-white rounded-full" />
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</form>
		</Fragment>
	);
}

export default ThirdRegistrationStep;
