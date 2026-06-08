import type { Enrollment, EnrollmentStatus } from '@/types';
import api from './client';

export interface CreateEnrollmentPayload {
  studentId: string;
  classId: string;
}

export async function listEnrollments(): Promise<Enrollment[]> {
  const { data } = await api.get<Enrollment[]>('/enrollments');
  return data;
}

export async function getEnrollmentById(id: string): Promise<Enrollment> {
  const { data } = await api.get<Enrollment>(`/enrollments/${id}`);
  return data;
}

export async function createEnrollment(payload: CreateEnrollmentPayload): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>('/enrollments', payload);
  return data;
}

export async function updateEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
): Promise<Enrollment> {
  const { data } = await api.patch<Enrollment>(`/enrollments/${id}/status`, { status });
  return data;
}

export async function deleteEnrollment(id: string): Promise<void> {
  await api.delete(`/enrollments/${id}`);
}
