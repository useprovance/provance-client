import { ScrollArea } from '@/components/ui/scroll-area';
import FormInput from '@/components/common/FormInput';
import { useState } from 'react';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import showToast from '@/utils/toast.util';

import { z } from 'zod';
import { useZodValidation } from '@/hooks/useZodValidation';
import PasswordToggle from '@/components/common/PasswordToggle';
import CircularSpinner from '@/components/common/CircularSpinnerProps';
import CheckboxOption from '@/components/common/CheckboxOption';
const LoginSchema = z.object({
	email: z.email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters long'),
});

// Inferred TypeScript type
type LoginData = z.infer<typeof LoginSchema>;

function Login() {
	const initialData = { email: '', password: '' };
	const [formData, setFormData] = useState<LoginData>(initialData);
	const { errors, touched, validateAndTouch } = useZodValidation(initialData);
	const [passwordVisibility, setPasswordVisibility] = useState({
		password: false,
	});
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	const handleInputChange = (field: keyof typeof formData, value: string) => {
		setFormData(prev => {
			const newData = { ...prev, [field]: value };
			validateAndTouch(LoginSchema, newData, field);
			return newData;
		});
	};

	const validateForm = async () => {
		try {
			const validatedData = LoginSchema.parse(formData);
			console.log('Valid data :', validatedData);
		} catch (err) {
			if (err instanceof z.ZodError) {
				console.log('Validation errors :', err.issues);
			}
		}
	};

	const handleSignIn = async () => {
		try {
			setLoading(true);
			validateForm();
		} catch (error) {
			console.log(error);
			showToast.error('Login Failed');
		} finally {
			setLoading(false);
		}
	};

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

	const MailIcon = () => (
		<div className="text-gray-400 pr-5 pl-2">
			<Mail />
		</div>
	);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[55%_45%] grid-rows-[100vh]   h-screen">
			<div className="h-full ">
				<ScrollArea className="h-full">
					<div className="px-1 max-w-[37.9rem] mx-auto pb-8">
						<div className="px-5 md:px-1 ">
							<header className="flex justify-between items-center mt-8 md:mt-18">
								<img
									className="font-jakarta size-11 "
									src="/icons/logo.svg"
								/>
							</header>
							<div className="mt-12 ">
								<h1 className="font-semibold text-3xl font-jakarta">
									Welcome Back!
								</h1>
								<p className="text-gray-600 font-jakarta mt-4">
									Are you new here ?{' '}
									<Link
										className="text-blue-700 hover:underline"
										to="/auth/register"
									>
										Create Account
									</Link>
								</p>
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
								<div className="flex items-center gap-4 mt-8">
									<hr className="w-full bg-zinc-400" />
									<p className="font-jakarta text-zinc-400 text-sm">
										Or
									</p>
									<hr className="w-full bg-zinc-400" />
								</div>
							</div>
							<form className="mt-8 space-y-8 b ">
								<FormInput
									label="Email"
									value={formData.email}
									onChange={value => handleInputChange('email', value)}
									placeholder="Enter your full name"
									required
									type="email"
									error={errors.email}
									touched={touched.email}
									suffix={<MailIcon />}
								/>
								<FormInput
									label="Password"
									value={formData.password}
									onChange={value =>
										handleInputChange('password', value)
									}
									placeholder="Enter your password"
									required
									type={
										passwordVisibility.password ? 'text' : 'password'
									}
									suffix={
										<PasswordToggle
											onToggle={() =>
												handlePasswordToggle('password')
											}
											isPasswordVisible={passwordVisibility.password}
										/>
									}
								/>
							</form>
							<div className="mt-8  justify-between flex md:flex-row flex-col gap-7">
								<CheckboxOption
									checked={rememberMe}
									onChange={setRememberMe}
									label="Remember Me"
									className="mt-0"
								/>
								<Link
									to="/auth/password/forgot"
									className="text-blue-500 font-jakarta hover:underline"
								>
									Forget Password ?
								</Link>
							</div>
							<button
								onClick={handleSignIn}
								disabled={loading}
								className="bg-blue-600 hover:bg-blue-700 active:bg-blue-700 disabled:bg-blue-300 mt-9 disabled:cursor-not-allowed text-white font-semibold font-jakarta px-14 py-3 rounded-lg transition-colors duration-200 outline-none ring-2 ring-blue-500 ring-offset-2 cursor-pointer "
							>
								{loading ? <CircularSpinner size={22} /> : 'Sign In'}
							</button>
						</div>
					</div>
				</ScrollArea>
			</div>

			<div className="bg-green-100 rounded-xl lg:block hidden "></div>
		</div>
	);
}

export default Login;
