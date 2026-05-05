import { randomUUID } from 'crypto';
import { Certificate } from '../../domain/Certificate';
import { ICertificateRepository } from '../../domain/ICertificateRepository';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';
import { IUserRepository } from '../../domain/IUserRepository';
import { IClassRepository } from '../../domain/IClassRepository';
import { LambdaService } from '../../infrastructure/services/LambdaService';
import { S3Service } from '../../infrastructure/services/S3Service';

interface CertificateWithUrl {
  id: string;
  enrollmentId: string;
  s3Key: string;
  downloadUrl: string;
  issuedAt: Date;
}

export class GenerateCertificateUseCase {
  constructor(
    private certificateRepository: ICertificateRepository,
    private enrollmentRepository: IEnrollmentRepository,
    private userRepository: IUserRepository,
    private classRepository: IClassRepository,
    private lambdaService: LambdaService,
    private s3Service: S3Service,
  ) {}

  async execute(enrollmentId: string): Promise<CertificateWithUrl> {
    const existing = await this.certificateRepository.findByEnrollmentId(enrollmentId);
    if (existing) {
      const downloadUrl = await this.s3Service.getPresignedDownloadUrl(existing.s3Key);
      return { ...existing, downloadUrl };
    }

    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    if (enrollment.status !== 'completed') throw new Error('Enrollment is not completed');

    const student = await this.userRepository.findById(enrollment.studentId);
    if (!student) throw new Error('Student not found');

    const cls = await this.classRepository.findById(enrollment.classId);
    if (!cls) throw new Error('Class not found');

    const certificateId = randomUUID();
    const s3Key = `certificates/${enrollmentId}/${certificateId}.pdf`;

    await this.lambdaService.invoke(
      process.env.LAMBDA_CERTIFICATE_FUNCTION || 'klass-generate-certificate',
      {
        certificateId,
        studentName: student.name,
        className: cls.title,
        enrollmentId,
        s3Key,
        s3Bucket: process.env.S3_BUCKET_NAME,
      },
    );

    const certificate = new Certificate(certificateId, enrollmentId, s3Key, new Date());
    await this.certificateRepository.create(certificate);

    const downloadUrl = await this.s3Service.getPresignedDownloadUrl(s3Key);
    return { ...certificate, downloadUrl };
  }
}
