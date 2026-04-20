import { compare, hash } from "bcryptjs";
import { prisma } from "../../utils/prisma.js";
import { registerSchema, loginSchema, roleSchema } from "./auth.schema.js";
import { generateToken } from "../../utils/jwt.js";
import type { UserRole } from "@prisma/client";
import { ensurePendingConsent, isMinor } from "../consent/consent.service.js";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  dateOfBirth?: string;
}) {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new Error("A user with that email already exists");
  }

  const passwordHash = await hash(data.password, 12);
  const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: "STUDENT",
      dateOfBirth: dob ?? undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboardingStatus: true,
      dateOfBirth: true,
    },
  });

  // DPDP Act 2023: if the new user is under 18, stand up a PENDING
  // parental consent record immediately so the onboarding UI can surface
  // the "ask a parent to grant consent" step.
  if (isMinor(user.dateOfBirth)) {
    await ensurePendingConsent(user.id);
  }

  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const valid = await compare(data.password, user.passwordHash);
  if (!valid) return null;

  // Update last active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const token = generateToken({
    id: user.id,
    email: user.email ?? "",
    role: user.role,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    role: user.role,
    onboardingStatus: user.onboardingStatus,
    token,
  };
}

export async function setUserRole(userId: string, role: UserRole) {
  const data = roleSchema.parse({ role });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboardingStatus: true,
    },
  });

  return user;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      onboardingStatus: true,
      gradeLevel: true,
      studentId: true,
      schoolId: true,
      dateOfBirth: true,
      lastActiveAt: true,
      parentalConsent: {
        select: { status: true, tokenExpiresAt: true, respondedAt: true },
      },
    },
  });

  if (!user) return null;

  // Expose a flat `consentStatus` string so the client doesn't have to
  // reason about null vs missing. NOT_REQUIRED means the user is 18+ or
  // no DOB is on file yet.
  const consentStatus = user.parentalConsent?.status ?? "NOT_REQUIRED";
  return { ...user, consentStatus };
}

export async function findUser(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      onboardingStatus: true,
    },
  });
}

export async function createUserFromProvider(email: string, name: string, image?: string) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        image,
        role: "STUDENT",
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    onboardingStatus: user.onboardingStatus,
  };
}
