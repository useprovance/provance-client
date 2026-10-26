import { env } from '@/utils/env.utils';
import axios, { type AxiosInstance, AxiosError } from 'axios';

export interface APIErrorResponse {
	error: string;
}

export class ApiError extends Error {
	public status: number;
	public response?: APIErrorResponse;

	constructor(message: string, status: number = 500, response?: APIErrorResponse) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.response = response;
	}
}

export class BaseApiService {
	protected api: AxiosInstance;

	constructor() {
		this.api = axios.create({
			baseURL: env.VITE_API_URL,
			withCredentials: true,
		});
	}

	protected handleError(error: unknown): ApiError {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<APIErrorResponse>;

			if (axiosError.response) {
				const status = axiosError.response.status;
				const data = axiosError.response.data;
				const message = data?.error ?? 'An error occurred';
				return new ApiError(message, status, data);
			} else if (axiosError.request) {
				return new ApiError('Network error — check your connection', 0);
			}
		}

		if (error instanceof Error) return new ApiError(error.message, 500);
		return new ApiError('Something went wrong', 500);
	}
}
