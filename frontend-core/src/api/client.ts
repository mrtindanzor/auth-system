import axios, { type AxiosInstance } from "axios";

export type AuthApiConfig = {
	baseUrl: string;
	getAccessToken?: () => string | null;
	withCredentials?: boolean;
};

export function createAuthAxiosClient(config: AuthApiConfig): AxiosInstance {
	const token = config.getAccessToken?.() ?? null;

	return axios.create({
		baseURL: config.baseUrl,
		headers: {
			Authorization: token ? `Bearer ${token}` : undefined,
		},
		withCredentials: config.withCredentials ?? true,
	});
}
