import bcrypt from "bcrypt";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import type { AuthSecretsConfig } from "../config";
import { NotFoundError, UnauthorizedError, ValidationError } from "../errors";
import { assertUniqueNewAccount, assertUserExists } from "../user/rules";
import type { IUserAccount, IUserService } from "../user/user.contracts.types";
import { syncTryCatch, tryCatch } from "../utils/tryCatch";
import type {
	AllAuthTokens,
	IAuthService,
	ISigninProps,
	ISignupProps,
} from "./auth.contracts.types";
import { roleBuilder } from "./auth.roles";

export class AuthService<
	TUserAccount extends IUserAccount,
	TSignupProps extends ISignupProps<TUserAccount>,
	TSigninProps extends ISigninProps,
> implements IAuthService
{
	constructor(
		private userService: IUserService<TUserAccount>,
		private config: AuthSecretsConfig,
	) {}

	async signin(
		details: TSigninProps,
	): Promise<AllAuthTokens & { user: TUserAccount }> {
		let user: TUserAccount | null = null;

		if ("email" in details && "phone" in details) {
			user = await this.userService.findByEmailOrPhone({
				email: details.email,
				phone: details.phone as string,
			});
		} else if ("email" in details) {
			user = await this.userService.findByEmail(details.email);
		} else if ("phone" in details) {
			// biome-ignore lint/suspicious/noExplicitAny: This exists on the interface
			user = await this.userService.findOne("phone" as any, details.phone);
		} else if ("username" in details) {
			user = await this.userService.findOne(
				// biome-ignore lint/suspicious/noExplicitAny: This exists on the interface
				"username" as any,
				details.username,
			);
		}

		const foundUser = assertUserExists(user);
		const isPasswordMatch = await bcrypt.compare(
			details.password,
			foundUser.password,
		);

		if (!isPasswordMatch) throw new ValidationError("Invalid credentials");
		const tokens = await this.getAuthTokens(foundUser, foundUser.roles);
		return {
			...tokens,
			user: foundUser,
		};
	}

	async signup({
		password,
		...details
	}: TSignupProps): Promise<AllAuthTokens & { user: TUserAccount }> {
		let isExists: TUserAccount | null = null;

		if ("email" in details && "phone" in details) {
			isExists = await this.userService.findByEmailOrPhone({
				email: details.email as string,
				phone: details.phone as string,
			});
		} else if ("email" in details) {
			isExists = await this.userService.findByEmail(details.email as string);
		} else if ("phone" in details) {
			isExists = await this.userService.findOne(
				// biome-ignore lint/suspicious/noExplicitAny: This exists on the interface
				"phone" as any,
				details.phone as string,
			);
		} else if ("username" in details) {
			isExists = await this.userService.findOne(
				// biome-ignore lint/suspicious/noExplicitAny: This exists on the interface
				"username" as any,
				details.username as string,
			);
		}

		assertUniqueNewAccount(isExists, "email address or phone number");
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await this.userService.save({
			...details,
			password: hashedPassword,
		});
		const tokens = await this.getAuthTokens(user, user.roles);
		return {
			...tokens,
			user,
		};
	}

	async requestPasswordReset(email: string) {
		const user = await this.userService.findByEmail(email);
		if (!user) return null;

		const resetToken = await this.getToken(
			{ userId: user.id, hash: user.password },
			"10m",
			this.config.getPasswordResetToken(user.password),
		);
		return resetToken;
	}

	async resetPassword(password: string, access: string) {
		const decoded = this.decodeToken<{ userId: string }>(access);
		if (!decoded)
			throw new UnauthorizedError("This password reset link is invalid.");

		const foundUser = await this.userService.findById(decoded.userId);
		if (!foundUser) throw new NotFoundError("User not found!");

		const isValid = await this.verifyToken<{ userId: string }>(
			access,
			this.config.getPasswordResetToken(foundUser.password),
		);
		if (!isValid)
			throw new UnauthorizedError("This password reset link is invalid.");

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await this.userService.updateOneById(isValid.userId, {
			password: hashedPassword,
		} as TUserAccount);

		if (!user) throw new NotFoundError("User not found!");
		return user;
	}

	async getRegistrationAccessUrl(url: string) {
		const access = await this.getToken(
			{},
			"10m",
			this.config.getRegistrationSecret(""),
		);
		return `${url}?access=${access}`;
	}

	async protectedSignup(
		access: string,
		details: TSignupProps,
	): Promise<AllAuthTokens & { user: TUserAccount }> {
		const decoded = this.decodeToken<{
			id: string;
			password: string;
		}>(access);
		if (!decoded) throw new UnauthorizedError();

		const isValid = await this.verifyToken<{ id: string }>(
			access,
			this.config.getRegistrationSecret(decoded.password),
		);

		if (!isValid) throw new UnauthorizedError();

		return this.signup(details);
	}

	async getClientFromCookie(
		authorization: string,
		role: TUserAccount["roles"],
	): Promise<TUserAccount | null> {
		const user = await this.verifyAuthToken(authorization, "refresh", role);
		if (!user) return null;
		return this.userService.findById(user.userId);
	}

	async verifyAuthToken(
		token: string,
		type: "refresh",
		roles: TUserAccount["roles"],
	): Promise<{ userId: string; roles: TUserAccount["roles"] } | null>;
	async verifyAuthToken(
		token: string,
		type: "access",
		roles: TUserAccount["roles"],
	): Promise<TUserAccount | null>;
	async verifyAuthToken(
		token: string,
		type: "access" | "refresh",
		roles: TUserAccount["roles"],
	): Promise<
		{ userId: string; roles: TUserAccount["roles"] } | TUserAccount | null
	> {
		switch (type) {
			case "access": {
				const user = await this.verifyToken<TUserAccount>(
					token,
					this.config.accessSecret,
				);
				if (!user || !roleBuilder(user.roles ?? [], roles).passes())
					return null;

				return user;
			}

			case "refresh": {
				const user = await this.verifyToken<{
					userId: string;
					roles: TUserAccount["roles"];
				}>(token, this.config.refreshSecret);

				if (!user || !roleBuilder(user.roles ?? [], roles).passes())
					return null;

				return user;
			}
			default:
				throw new ValidationError("Auth mode not defined!");
		}
	}

	async getToken<U extends Record<string, unknown>>(
		payload: U,
		exp: string,
		secret: Uint8Array,
	): Promise<string> {
		return await new SignJWT(payload)
			.setExpirationTime(exp)
			.setIssuedAt()
			.setProtectedHeader({ alg: "HS256" })
			.sign(secret);
	}

	async getAuthTokens<U extends { id: string; password?: string }>(
		payload: U,
		roles: TUserAccount["roles"],
	): Promise<AllAuthTokens> {
		const { id, password: _p, ...rest } = payload;
		const [accessToken, refreshToken] = await Promise.all([
			this.getToken(
				{ userId: id, id, ...rest, roles },
				"1d",
				this.config.accessSecret,
			),
			this.getToken({ userId: id, roles }, "3d", this.config.refreshSecret),
		]);
		return { accessToken, refreshToken };
	}

	private decodeToken<T>(token: string) {
		const data = syncTryCatch(() => decodeJwt<T>(token));
		return data.success ? data.data : null;
	}

	roles<
		TUser extends IUserAccount,
		Roles extends TUser["roles"] = TUser["roles"],
	>(userRoles: Roles) {
		return roleBuilder<TUser, Roles>(userRoles, []);
	}

	private async verifyToken<T>(token: string, secret: Uint8Array) {
		const decoded = await tryCatch(jwtVerify<T>(token, secret));
		if (!decoded.success) return null;
		const {
			aud: _a,
			exp: _ex,
			iat: _ia,
			iss: _is,
			jti: _jt,
			sub: _su,
			nbf: _nb,
			...rest
		} = decoded.data.payload;
		return rest as T;
	}
}
