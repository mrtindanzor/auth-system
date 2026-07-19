export const fe = (error: unknown) => {
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.message;
	return "Something went wrong";
};
