import { sign } from 'jsonwebtoken';

const LOCAL_JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || 'chefconnect-local-dev-secret';
}

export function createLocalAccessToken(payload: {
  sub: string;
  email: string;
  role: string;
}): { accessToken: string; expiresIn: number } {
  const expiresIn = LOCAL_JWT_EXPIRES_IN_SECONDS;

  const accessToken = sign(payload, getJwtSecret(), {
    expiresIn,
  });

  return { accessToken, expiresIn };
}
