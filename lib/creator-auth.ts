import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "frontdoor_creator_session";
const SESSION_DAYS = 30;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const existing = Buffer.from(hash, "hex");
  return existing.length === candidate.length && timingSafeEqual(existing, candidate);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCreatorSession(creatorAccountId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.creatorSession.create({
    data: {
      tokenHash: tokenHash(token),
      creatorAccountId,
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return expiresAt;
}

export async function clearCreatorSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.creatorSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
  }
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCreatorAccount() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.creatorSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { creatorAccount: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.creatorSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.creatorAccount;
}

export async function claimExistingSubmissions(creatorAccountId: string, email: string) {
  await db.submission.updateMany({
    where: {
      creatorAccountId: null,
      email: { equals: normalizeEmail(email), mode: "insensitive" },
    },
    data: { creatorAccountId },
  });
}
