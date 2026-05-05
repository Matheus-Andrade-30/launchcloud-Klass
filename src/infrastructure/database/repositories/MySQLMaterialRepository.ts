import { RowDataPacket } from 'mysql2';
import { Material } from '../../../domain/Material';
import { IMaterialRepository } from '../../../domain/IMaterialRepository';
import { pool } from '../connection';

interface MaterialRow extends RowDataPacket {
  id: string;
  title: string;
  description: string;
  class_id: string;
  uploaded_by: string;
  s3_key: string;
  content_type: string;
  uploaded_at: Date;
}

function rowToMaterial(r: MaterialRow): Material {
  return new Material(
    r.id,
    r.title,
    r.description,
    r.class_id,
    r.uploaded_by,
    r.s3_key,
    r.content_type,
    r.uploaded_at,
  );
}

export class MySQLMaterialRepository implements IMaterialRepository {
  async create(material: Material): Promise<Material> {
    await pool.execute(
      'INSERT INTO materials (id, title, description, class_id, uploaded_by, s3_key, content_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        material.id,
        material.title,
        material.description,
        material.classId,
        material.uploadedBy,
        material.s3Key,
        material.contentType,
        material.uploadedAt,
      ],
    );
    return material;
  }

  async findAll(): Promise<Material[]> {
    const [rows] = await pool.execute<MaterialRow[]>('SELECT * FROM materials');
    return rows.map(rowToMaterial);
  }

  async findById(id: string): Promise<Material | null> {
    const [rows] = await pool.execute<MaterialRow[]>('SELECT * FROM materials WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rowToMaterial(rows[0]);
  }

  async findByClassId(classId: string): Promise<Material[]> {
    const [rows] = await pool.execute<MaterialRow[]>('SELECT * FROM materials WHERE class_id = ?', [
      classId,
    ]);
    return rows.map(rowToMaterial);
  }
}
