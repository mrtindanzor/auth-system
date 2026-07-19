export function getBearerToken(bearer: string | null) {
	return bearer?.split(" ")[1] ?? "";
}
