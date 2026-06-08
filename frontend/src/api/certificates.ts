import type { Certificate } from '@/types';
import api from './client';

interface CertificateWithUrl extends Certificate {
  downloadUrl: string;
}

export async function generateCertificate(enrollmentId: string): Promise<CertificateWithUrl> {
  const { data } = await api.post<CertificateWithUrl>(`/certificates/enrollment/${enrollmentId}`);
  return data;
}

export async function getCertificate(enrollmentId: string): Promise<CertificateWithUrl> {
  const { data } = await api.get<CertificateWithUrl>(`/certificates/${enrollmentId}`);
  return data;
}

export async function getCertificateById(id: string): Promise<CertificateWithUrl> {
  const { data } = await api.get<CertificateWithUrl>(`/certificates/${id}`);
  return data;
}
