import { AxiosError } from "axios";

export const fe = (error: unknown) => {
	if (typeof error === "string") return error;

	if (error instanceof AxiosError)
		return (error.response?.data?.message as string) || error?.message;

	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;

	return "Something went wrong";
};
