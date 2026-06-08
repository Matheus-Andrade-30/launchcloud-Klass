import type { Material } from '@/types';
import api from './client';

export interface UploadMaterialPayload {
  title: string;
  description: string;
  classId: string;
  uploadedBy: string;
  file: File;
}

interface MaterialWithUrl extends Material {
  downloadUrl: string;
}

export async function listMaterials(): Promise<Material[]> {
  const { data } = await api.get<Material[]>('/materials');
  return data;
}

export async function getMaterialById(id: string): Promise<MaterialWithUrl> {
  const { data } = await api.get<MaterialWithUrl>(`/materials/${id}`);
  return data;
}

export async function listMaterialsByClass(classId: string): Promise<Material[]> {
  const { data } = await api.get<Material[]>(`/materials/class/${classId}`);
  return data;
}

export async function uploadMaterial(payload: UploadMaterialPayload): Promise<Material> {
  const form = new FormData();
  form.append('file', payload.file);
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('classId', payload.classId);
  form.append('uploadedBy', payload.uploadedBy);

  const { data } = await api.post<Material>('/materials', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getMaterialDownloadUrl(id: string): Promise<string> {
  const { data } = await api.get<MaterialWithUrl>(`/materials/${id}`);
  return data.downloadUrl;
}
