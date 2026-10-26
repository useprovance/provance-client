import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import Stepper from '@/components/common/Stepper';
import FirstRegistrationStep, {
	type FirstRegistrationProps,
} from '@/components/coursehub/FirstRegistrationStep';
import showToast from '@/utils/toast.util';
import SecondRegistrationStep from '@/components/coursehub/SecondRegistrationStep';
import ThirdRegistrationStep from '@/components/coursehub/ThirdRegistrationStep';
import { useZodValidation } from '@/hooks/useZodValidation';
import { z } from 'zod';
import CircularSpinner from '@/components/common/CircularSpinnerProps';
import { authService } from '@/services/auth.service';

const registrationSchema = z
	.object({
		firstName: z
			.string()
			.min(1, 'First name is required')
			.min(2, 'First name must be at least 2 characters')
			.max(50, 'First name must be less than 50 characters')
			.regex(
				/^[a-zA-Z\s]+$/,
				'First name can only contain letters and spaces'
			),

		lastName: z
			.string()
			.min(1, 'Last name is required')
			.min(2, 'Last name must be at least 2 characters')
			.max(50, 'Last name must be less than 50 characters')
			.regex(
				/^[a-zA-Z\s]+$/,
				'Last name can only contain letters and spaces'
			),

		email: z
			.email('Please enter a valid email address')
			.min(1, 'Email is required')

			.toLowerCase(),

		phoneNumber: z
			.string()
			.min(1, 'Phone number is required')
			.min(10, 'Phone number must be at least 10 digits')
			.max(15, 'Phone number must be less than 15 digits')
			.regex(/^[+]?[0-9\s\-()]+$/, 'Please enter a valid phone number'),

		password: z
			.string()
			.min(1, 'Password is required')
			.min(8, 'Password must be at least 8 characters long')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),

		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function Register() {
	const initialData = {
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		phoneNumber: '',
		confirmPassword: '',
	};
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<RegistrationFormData>(initialData);

	const { errors, touched, validateAndTouch, validate, markAllTouched } =
		useZodValidation(initialData);

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();

		// Mark all fields as touched to show errors
		markAllTouched();

		// Validate the form
		const validData = validate(registrationSchema, formData);
		if (!validData) {
			showToast.error('Please fix the errors before continuing');
			return;
		}

		try {
			setLoading(true);

			showToast.success('Registration Successful');
			await authService.register(formData);
			//Navigate to login
			// navigate('/auth/otp');
		} catch (error) {
			console.log(error);
			showToast.error('Registration failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (
		field: keyof FirstRegistrationProps['formData'],
		value: string
	) => {
		setFormData(prev => {
			const newData = { ...prev, [field]: value };
			validateAndTouch(registrationSchema, newData, field);

			return newData;
		});
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<FirstRegistrationStep
						formData={formData}
						errors={errors}
						touched={touched}
						onInputChange={handleInputChange}
					/>
				);

			case 2:
				return <SecondRegistrationStep />;

			case 3:
				return <ThirdRegistrationStep />;

			default:
				return (
					<FirstRegistrationStep
						formData={formData}
						errors={errors}
						touched={touched}
						onInputChange={handleInputChange}
					/>
				);
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[45%_55%] grid-rows-[100vh]   h-screen">
			<div className="bg-blue-100 rounded-xl hidden lg:block"></div>
			<div className="h-full">
				<ScrollArea className="h-full ">
					<div className="px-6 md:px-4 max-w-[37.9rem] mx-auto pb-8">
						<header className="flex justify-between items-center mt-8 md:mt-18">
							<img
								className="font-jakarta size-11 "
								src="/icons/logo.svg"
							/>
						</header>
						{renderStepContent()}
						<div className="flex md:flex-row flex-col gap-7 justify-between mt-8">
							<Stepper
								currentStep={currentStep}
								totalSteps={3}
								onStepClick={setCurrentStep}
								variant="rounded"
								// clickableSteps={false}
							/>
							<button
								onClick={handleSignIn}
								disabled={loading}
								className="bg-blue-600 hover:bg-blue-700 active:bg-blue-700 disabled:bg-blue-300  disabled:cursor-not-allowed text-white font-semibold font-jakarta px-14 py-3 rounded-lg transition-colors duration-200 outline-none focus:ring-2 ring-blue-500 focus:ring-offset-2 cursor-pointer "
							>
								{loading ? <CircularSpinner size={22} /> : 'Continue'}
							</button>
						</div>
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

export default Register;
