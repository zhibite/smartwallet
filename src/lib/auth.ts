import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import type { Role, User } from '@prisma/client';

const COOKIE_NAME = 'smartwallet_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error('SESSION_SECRET is missing (need >= 16 chars)');
  }
  return new TextEncoder().encode(raw);
}

export interface SessionPayload {
  uid: string;
  username: string;
  role: Role;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      uid: String(payload.uid),
      username: String(payload.username),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export class AuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError(401, 'Not authenticated');
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== 'ADMIN') throw new AuthError(403, 'Admin only');
  return session;
}

/**
 * 凭据校验 + 写审计日志
 */
export async function authenticate(username: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.enabled) {
    throw new AuthError(401, 'Invalid credentials');
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError(401, 'Invalid credentials');
  }
  return user;
}

export async function recordAudit(
  userId: string | null,
  action: string,
  target?: string,
  payload?: unknown,
  meta?: { ip?: string; userAgent?: string },
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      target,
      payload: payload === undefined ? undefined : (payload as object),
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
