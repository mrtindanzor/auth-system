export type TRequestPasswordReset = {
	email: string;
	url: string;
	queryName?: string | "access";
};

export type TResetPassword = {
	password: string;
	confirmPassword: string;
	token: string;
};

export type TPasswordResetResponse = {
	success: boolean;
	message: string;
	error: boolean;
};

export interface IAuthService<TLogin extends object, TRegister extends object> {
	login(payload: TLogin): Promise<string>;
	register(payload: TRegister): Promise<string>;
	logout(): Promise<void>;
	refresh(): Promise<string>;
	requestPasswordReset(email: string): Promise<TPasswordResetResponse>;
	resetPassword(payload: TResetPassword): Promise<TPasswordResetResponse>;
}
