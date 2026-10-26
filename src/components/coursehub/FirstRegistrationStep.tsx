import FormInput from '../common/FormInput';
import { Link } from 'react-router';
import { Fragment } from 'react/jsx-runtime';
import { Mail } from 'lucide-react';
import PasswordToggle from '../common/PasswordToggle';
import { useState } from 'react';
import CheckboxOption from '../common/CheckboxOption';
import showToast from '@/utils/toast.util';

export interface FirstRegistrationProps {
	formData: {
		firstName: string;
		lastName: string;
		email: string;
		phoneNumber: string;
		password: string;
		confirmPassword: string;
	};
	errors: Record<string, string>;
	touched: Record<string, boolean>;
	onInputChange: <K extends keyof FirstRegistrationProps['formData']>(
		field: K,
		value: FirstRegistrationProps['formData'][K]
	) => void;
}

function FirstRegistrationStep(props: FirstRegistrationProps) {
	const [passwordVisibility, setPasswordVisibility] = useState({
		password: false,
		confirmPassword: false,
	});

	const [acceptPolicy, setAcceptPolicy] = useState(false);

	const MailIcon = () => (
		<div className="text-gray-400 pr-5 pl-2">
			<Mail />
		</div>
	);

	const handlePasswordToggle = (field: keyof typeof passwordVisibility) => {
		setPasswordVisibility(prev => ({
			...prev,
			[field]: !prev[field],
		}));
	};

	const handleOAuthLogin = async (provider: 'google' | 'github') => {
		try {
			showToast.message(
				`${
					provider.charAt(0).toUpperCase() + provider.slice(1)
				} registration is coming soon!`
			);
			// await authService.loginWithOAuth(provider);
		} catch (error: unknown) {
			console.error(`${provider} login failed:`, error);
			showToast.error(`${provider} registration failed. Please try again.`);
		}
	};

	const CountrySelector = () => (
		<div className="flex items-center px-2 border-r border-r-gray-400">
			<select className="bg-transparent text-gray-700 text-sm font-medium">
				<option value="+234">+234</option>
				<option value="+1">+1</option>
				<option value="+44">+44</option>
			</select>
		</div>
	);

	return (
		<Fragment>
			<div className="mt-12">
				<h1 className="font-semibold text-3xl font-jakarta">
					Create Your Account
				</h1>
				<p className="text-gray-600 font-jakarta mt-4">
					Already have an account?{' '}
					<Link className="text-blue-700 hover:underline" to="/auth/login">
						Sign In
					</Link>
				</p>
				<div className="flex items-center gap-4 mt-8">
					<hr className="w-full bg-zinc-400" />
					<p className="font-jakarta text-zinc-400">Or</p>
					<hr className="w-full bg-zinc-400" />
				</div>
				<div className="flex items-center justify-center mt-8 gap-4">
					<button
						onClick={() => handleOAuthLogin('google')}
						className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						<img
							className="w-5 h-5"
							src="/icons/google.svg"
							alt="Google logo"
						/>
						<span className="text-sm font-jakarta font-medium text-gray-700">
							Continue with Google
						</span>
					</button>
					<button
						onClick={() => handleOAuthLogin('github')}
						className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						<img
							className="w-5 h-5"
							src="/icons/github.svg"
							alt="GitHub logo"
						/>
						<span className="text-sm font-jakarta font-medium text-gray-700">
							Continue with Github
						</span>
					</button>
				</div>
			</div>

			<form className="mt-8 space-y-6">
				<FormInput
					label="First Name"
					value={props.formData.firstName}
					onChange={(value: string) =>
						props.onInputChange('firstName', value)
					}
					placeholder="Enter your first name"
					required
					error={props.errors.firstName}
					touched={props.touched.firstName}
				/>

				<FormInput
					label="Last Name"
					value={props.formData.lastName}
					onChange={(value: string) =>
						props.onInputChange('lastName', value)
					}
					placeholder="Enter your last name"
					required
					error={props.errors.lastName}
					touched={props.touched.lastName}
				/>

				<FormInput
					label="Email"
					value={props.formData.email}
					onChange={(value: string) => props.onInputChange('email', value)}
					placeholder="Enter your email"
					required
					type="email"
					error={props.errors.email}
					touched={props.touched.email}
					suffix={<MailIcon />}
				/>

				<FormInput
					label="Phone Number"
					value={props.formData.phoneNumber}
					onChange={(value: string) =>
						props.onInputChange('phoneNumber', value)
					}
					placeholder="8012345678"
					required
					error={props.errors.phoneNumber}
					touched={props.touched.phoneNumber}
					prefix={<CountrySelector />}
				/>

				<FormInput
					label="Password"
					value={props.formData.password}
					onChange={(value: string) =>
						props.onInputChange('password', value)
					}
					placeholder="Enter your password"
					required
					type={passwordVisibility.password ? 'text' : 'password'}
					error={props.errors.password}
					touched={props.touched.password}
					suffix={
						<PasswordToggle
							onToggle={() => handlePasswordToggle('password')}
							isPasswordVisible={passwordVisibility.password}
						/>
					}
				/>

				<FormInput
					label="Confirm Password"
					value={props.formData.confirmPassword}
					onChange={(value: string) =>
						props.onInputChange('confirmPassword', value)
					}
					placeholder="Confirm your password"
					required
					type={passwordVisibility.confirmPassword ? 'text' : 'password'}
					error={props.errors.confirmPassword}
					touched={props.touched.confirmPassword}
					suffix={
						<PasswordToggle
							onToggle={() => handlePasswordToggle('confirmPassword')}
							isPasswordVisible={passwordVisibility.confirmPassword}
						/>
					}
				/>
			</form>

			<div className="mt-8">
				<CheckboxOption
					checked={acceptPolicy}
					onChange={setAcceptPolicy}
					label="By selecting this, I agree to CourseHub's Terms of Service and Privacy Policy"
					className="mt-0"
				/>
			</div>
		</Fragment>
	);
}

export default FirstRegistrationStep;
