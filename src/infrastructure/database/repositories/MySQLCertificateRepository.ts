import { RowDataPacket } from 'mysql2';
import { Certificate } from '../../../domain/Certificate';
import { ICertificateRepository } from '../../../domain/ICertificateRepository';
import { pool } from '../connection';

interface CertificateRow extends RowDataPacket {
  id: string;
  enrollment_id: string;
  s3_key: string;
  issued_at: Date;
}

function rowToCertificate(r: CertificateRow): Certificate {
  return new Certificate(r.id, r.enrollment_id, r.s3_key, r.issued_at);
}

export class MySQLCertificateRepository implements ICertificateRepository {
  async create(certificate: Certificate): Promise<Certificate> {
    await pool.execute(
      'INSERT INTO certificates (id, enrollment_id, s3_key, issued_at) VALUES (?, ?, ?, ?)',
      [certificate.id, certificate.enrollmentId, certificate.s3Key, certificate.issuedAt],
    );
    return certificate;
  }

  async findById(id: string): Promise<Certificate | null> {
    const [rows] = await pool.execute<CertificateRow[]>('SELECT * FROM certificates WHERE id = ?', [
      id,
    ]);
    if (rows.length === 0) return null;
    return rowToCertificate(rows[0]);
  }

  async findByEnrollmentId(enrollmentId: string): Promise<Certificate | null> {
    const [rows] = await pool.execute<CertificateRow[]>(
      'SELECT * FROM certificates WHERE enrollment_id = ?',
      [enrollmentId],
    );
    if (rows.length === 0) return null;
    return rowToCertificate(rows[0]);
  }
}
