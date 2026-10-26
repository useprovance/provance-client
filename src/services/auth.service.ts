import { env } from '@/utils/env.utils';
import { BaseApiService } from './api.service';

export type Profile = {
	id: string;
	name: string;
	email: string | null;
	avatar_url: string | null;
	provider: string;
	onboarded: boolean;
};

class AuthService extends BaseApiService {
	googleLogin() {
		window.location.href = `${env.VITE_API_URL}/auth/google`;
	}

	async me(): Promise<Profile> {
		try {
			const res = await this.api.get<{ user: Profile }>('/auth/me');
			return res.data.user;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async sendEmailOtp(email: string): Promise<{ ok: true }> {
		try {
			const res = await this.api.post<{ ok: true }>('/auth/email/send', { email });
			return res.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async verifyEmailOtp(email: string, code: string): Promise<{ ok: true; redirect: string }> {
		try {
			const res = await this.api.post<{ ok: true; redirect: string }>('/auth/email/verify', { email, code });
			return res.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async logout(): Promise<void> {
		try {
			await this.api.post('/auth/logout');
		} catch {
			// ignore — server clears cookie regardless
		}
	}
}

export const authService = new AuthService();
