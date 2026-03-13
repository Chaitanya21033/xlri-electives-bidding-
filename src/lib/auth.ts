import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentProfileId?: string;
  professorProfileId?: string;
}

const SESSION_COOKIE = "elective_session";
const SESSION_DURATION_DAYS = 7;

export async function createSession(userId: string): Promise<string> {
  const { randomBytes } = await import("crypto");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          studentProfile: true,
          professorProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    return null;
  }

  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    studentProfileId: session.user.studentProfile?.id,
    professorProfileId: session.user.professorProfile?.id,
  };
}

export async function requireAuth(
  allowedRoles?: UserRole[]
): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      studentProfile: true,
      professorProfile: true,
    },
  });

  if (!user || !user.isActive) return null;

  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentProfileId: user.studentProfile?.id,
    professorProfileId: user.professorProfile?.id,
  };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export { SESSION_COOKIE };
