import type { Enrollment, EnrollmentStatus } from '@/types';
import { enrollmentStore, uuid } from '@/lib/localStore';

export interface CreateEnrollmentPayload {
  studentId: string;
  classId: string;
}

export async function listEnrollments(): Promise<Enrollment[]> {
  return enrollmentStore.list();
}

export async function getEnrollmentById(id: string): Promise<Enrollment> {
  const e = enrollmentStore.findById(id);
  if (!e) throw new Error('Matrícula não encontrada');
  return e;
}

export async function createEnrollment(payload: CreateEnrollmentPayload): Promise<Enrollment> {
  return enrollmentStore.create({
    id: uuid(),
    studentId: payload.studentId,
    classId: payload.classId,
    status: 'active',
    enrolledAt: new Date().toISOString(),
  });
}

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<Enrollment> {
  return enrollmentStore.update(id, { status });
}

export async function deleteEnrollment(id: string): Promise<void> {
  enrollmentStore.remove(id);
}
