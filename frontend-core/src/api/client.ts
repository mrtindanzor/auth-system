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

export function attachTokenRefreshInterceptor(
  axios: AxiosInstance,
  onRefresh: () => Promise<string | null>,
  onRefreshFail?: () => void,
) {
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
  }> = [];

  const processQueue = (error: unknown, token: string | null = null) => {
    for (const prom of failedQueue) {
      if (error) prom.reject(error);
      else prom.resolve(token);
    }
    failedQueue = [];
  };

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await onRefresh();
          if (newToken) {
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
          processQueue(new Error("Token refresh failed"), null);
          onRefreshFail?.();
          return Promise.reject(error);
        } catch (refreshError) {
          processQueue(refreshError, null);
          onRefreshFail?.();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}
