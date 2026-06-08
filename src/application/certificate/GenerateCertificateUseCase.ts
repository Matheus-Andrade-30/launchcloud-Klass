import { randomUUID } from 'crypto';
import { Certificate } from '../../domain/Certificate';
import { ICertificateRepository } from '../../domain/ICertificateRepository';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';
import { IUserRepository } from '../../domain/IUserRepository';
import { IClassRepository } from '../../domain/IClassRepository';
import { IGradeRepository } from '../../domain/IGradeRepository';
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
    private gradeRepository?: IGradeRepository,
  ) {}

  async execute(enrollmentId: string): Promise<CertificateWithUrl> {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    if (enrollment.status !== 'completed') throw new Error('Enrollment is not completed');

    const student = await this.userRepository.findById(enrollment.studentId);
    if (!student) throw new Error('Student not found');

    const cls = await this.classRepository.findById(enrollment.classId);
    if (!cls) throw new Error('Class not found');

    // Nota final (ultima lancada) para personalizar o certificado.
    let grade: number | null = null;
    if (this.gradeRepository) {
      try {
        const grades = await this.gradeRepository.findByEnrollmentId(enrollmentId);
        const ultima = grades[grades.length - 1];
        grade = ultima ? Number(ultima.grade) : null;
      } catch {
        grade = null;
      }
    }

    // Reaproveita o registro existente, mas sempre (re)invoca a Lambda para garantir
    // o HTML no S3 (idempotente; gera mesmo se o registro existir sem arquivo).
    const existing = await this.certificateRepository.findByEnrollmentId(enrollmentId);
    const certificateId = existing ? existing.id : randomUUID();
    const s3Key = existing ? existing.s3Key : `certificates/${enrollmentId}/${certificateId}.html`;

    await this.lambdaService.invoke(
      process.env.LAMBDA_CERTIFICATE_FUNCTION || 'klass-generate-certificate',
      {
        certificateId,
        studentName: student.name,
        className: cls.title,
        classDescription: cls.description ?? null,
        grade,
        enrollmentId,
        s3Key,
        s3Bucket: process.env.S3_BUCKET_NAME,
      },
    );

    const certificate = existing ?? new Certificate(certificateId, enrollmentId, s3Key, new Date());
    if (!existing) await this.certificateRepository.create(certificate);

    const downloadUrl = await this.s3Service.getPresignedDownloadUrl(s3Key);
    return { ...certificate, downloadUrl };
  }
}
