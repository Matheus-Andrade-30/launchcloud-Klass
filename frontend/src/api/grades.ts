import type { Grade } from '@/types';
import api from './client';

export interface CreateGradePayload {
  enrollmentId: string;
  teacherId: string;
  grade: number;
  attendance: number;
  notes?: string;
}

export async function listGrades(): Promise<Grade[]> {
  const { data } = await api.get<Grade[]>('/grades');
  return data;
}

export async function getGradeById(id: string): Promise<Grade> {
  const { data } = await api.get<Grade>(`/grades/${id}`);
  return data;
}

export async function listGradesByEnrollment(enrollmentId: string): Promise<Grade[]> {
  const { data } = await api.get<Grade[]>(`/grades/enrollment/${enrollmentId}`);
  return data;
}

export async function createGrade(payload: CreateGradePayload): Promise<Grade> {
  const { data } = await api.post<Grade>('/grades', payload);
  return data;
}

export interface UpdateGradePayload {
  grade?: number;
  attendance?: number;
  notes?: string;
}

export async function updateGrade(id: string, payload: UpdateGradePayload): Promise<Grade> {
  const { data } = await api.put<Grade>(`/grades/${id}`, payload);
  return data;
}
