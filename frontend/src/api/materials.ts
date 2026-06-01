import type { Material } from '@/types';
import { materialStore, uuid } from '@/lib/localStore';

export interface UploadMaterialPayload {
  title: string;
  description: string;
  classId: string;
  uploadedBy: string;
  file: File;
}

export async function listMaterials(): Promise<Material[]> {
  return materialStore.list();
}

export async function getMaterialById(id: string): Promise<Material> {
  const m = materialStore.findById(id);
  if (!m) throw new Error('Material não encontrado');
  return m;
}

export async function listMaterialsByClass(classId: string): Promise<Material[]> {
  return materialStore.list().filter((m) => m.classId === classId);
}

export async function uploadMaterial(payload: UploadMaterialPayload): Promise<Material> {
  // Store file as a local object URL so it can be previewed
  const localUrl = URL.createObjectURL(payload.file);
  return materialStore.create({
    id: uuid(),
    title: payload.title,
    description: payload.description,
    classId: payload.classId,
    uploadedBy: payload.uploadedBy,
    s3Key: localUrl,
    contentType: payload.file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
  });
}
