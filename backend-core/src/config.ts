export type AuthSecretsConfig = {
  refreshSecret: Uint8Array;
  accessSecret: Uint8Array;
  getRegistrationSecret: (text: string) => Uint8Array;
  getPasswordResetToken: (text: string) => Uint8Array;
};

export function createAuthConfig(secrets: {
  refreshTokenSecret: string;
  accessTokenSecret: string;
  registrationSecret: string;
  passwordResetSecret: string;
}): AuthSecretsConfig {
  const getToken = (secret: string) => (text: string) =>
    new TextEncoder().encode(`${text}${secret}`);

  return {
    refreshSecret: new TextEncoder().encode(secrets.refreshTokenSecret),
    accessSecret: new TextEncoder().encode(secrets.accessTokenSecret),
    getRegistrationSecret: getToken(secrets.registrationSecret),
    getPasswordResetToken: getToken(secrets.passwordResetSecret),
  };
}
