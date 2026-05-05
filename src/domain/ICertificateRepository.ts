import { Certificate } from './Certificate';

export interface ICertificateRepository {
  create(certificate: Certificate): Promise<Certificate>;
  findById(id: string): Promise<Certificate | null>;
  findByEnrollmentId(enrollmentId: string): Promise<Certificate | null>;
}
