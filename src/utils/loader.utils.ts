import { authService } from '@/services/auth.service';

export async function loginPageLoader() {
	try {
		const userProfile = await authService.getProfile();

		console.log(userProfile);

		// if (userProfile?.data) {
		// 	// User is already logged in, redirect to dashboard
		// 	return redirect('/admin/dashboard');
		// }

		// User not logged in, can access login page
		return null;
	} catch (error) {
		console.log(error);
		// Auth failed, user can access login page
		console.log('Auth check failed, allowing access to login page');
		return null;
	}
}
