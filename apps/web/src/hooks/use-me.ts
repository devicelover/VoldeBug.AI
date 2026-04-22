import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

export interface MeProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  onboardingStatus: string;
  gradeLevel: number | null;
  studentId: string | null;
  schoolId: string | null;
  dateOfBirth: string | null;
  lastActiveAt: string;
  consentStatus?: "NOT_REQUIRED" | "PENDING" | "GRANTED" | "DENIED" | "EXPIRED";
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<MeProfile>("/v1/auth/me"),
    staleTime: 30_000,
  });
}

export interface UpdateMeInput {
  name?: string;
  image?: string;
  gradeLevel?: number;
  studentId?: string;
  dateOfBirth?: string;
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) =>
      api.patch<MeProfile>("/v1/users/me", input as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ─── Parental consent re-request (for minors whose token expired) ────────

export interface ConsentRequestResponse {
  status: string;
  consentUrl: string;
  tokenExpiresAt: string;
}

export function useRequestConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      parentEmail: string;
      parentName: string;
      parentRelationship: string;
    }) => api.post<ConsentRequestResponse>("/v1/consent/request", input as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
