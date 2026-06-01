import type { Grade } from '@/types';
import { gradeStore, uuid } from '@/lib/localStore';

export interface CreateGradePayload {
  enrollmentId: string;
  teacherId: string;
  grade: number;
  attendance: number;
  notes?: string;
}

export async function listGrades(): Promise<Grade[]> {
  return gradeStore.list();
}

export async function getGradeById(id: string): Promise<Grade> {
  const g = gradeStore.findById(id);
  if (!g) throw new Error('Nota não encontrada');
  return g;
}

export async function listGradesByEnrollment(enrollmentId: string): Promise<Grade[]> {
  return gradeStore.list().filter((g) => g.enrollmentId === enrollmentId);
}

export async function createGrade(payload: CreateGradePayload): Promise<Grade> {
  return gradeStore.create({
    id: uuid(),
    enrollmentId: payload.enrollmentId,
    teacherId: payload.teacherId,
    grade: payload.grade,
    attendance: payload.attendance,
    notes: payload.notes ?? '',
    createdAt: new Date().toISOString(),
  });
}
