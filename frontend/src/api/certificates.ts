import type { Certificate } from '@/types';
import { certStore, uuid } from '@/lib/localStore';

export async function generateCertificate(enrollmentId: string): Promise<Certificate> {
  const existing = certStore.list().find((c) => c.enrollmentId === enrollmentId);
  if (existing) return existing;
  return certStore.create({
    id: uuid(),
    enrollmentId,
    s3Key: `certificates/${enrollmentId}.pdf`,
    issuedAt: new Date().toISOString(),
  });
}

export async function getCertificateById(id: string): Promise<Certificate> {
  const c = certStore.findById(id);
  if (!c) throw new Error('Certificado não encontrado');
  return c;
}
