import { ICertificateRepository } from '../../domain/ICertificateRepository';
import { S3Service } from '../../infrastructure/services/S3Service';

interface CertificateWithUrl {
  id: string;
  enrollmentId: string;
  s3Key: string;
  downloadUrl: string;
  issuedAt: Date;
}

export class GetCertificateUseCase {
  constructor(
    private certificateRepository: ICertificateRepository,
    private s3Service: S3Service,
  ) {}

  async execute(id: string): Promise<CertificateWithUrl> {
    const certificate = await this.certificateRepository.findById(id);
    if (!certificate) throw new Error('Certificate not found');

    const downloadUrl = await this.s3Service.getPresignedDownloadUrl(certificate.s3Key);
    return { ...certificate, downloadUrl };
  }
}
