import { randomUUID } from 'crypto';
import { Material } from '../../domain/Material';
import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { IClassRepository } from '../../domain/IClassRepository';
import { IUserRepository } from '../../domain/IUserRepository';
import { S3Service } from '../../infrastructure/services/S3Service';

interface CreateMaterialDTO {
  title: string;
  description: string;
  classId: string;
  uploadedBy: string;
  fileBuffer: Buffer;
  contentType: string;
  originalName: string;
}

export class CreateMaterialUseCase {
  constructor(
    private materialRepository: IMaterialRepository,
    private classRepository: IClassRepository,
    private userRepository: IUserRepository,
    private s3Service: S3Service,
  ) {}

  async execute(dto: CreateMaterialDTO): Promise<Material> {
    const cls = await this.classRepository.findById(dto.classId);
    if (!cls) throw new Error('Class not found');

    const uploader = await this.userRepository.findById(dto.uploadedBy);
    if (!uploader) throw new Error('User not found');
    if (uploader.role !== 'teacher') throw new Error('Only teachers can upload materials');

    const id = randomUUID();
    const s3Key = `materials/${dto.classId}/${id}-${dto.originalName}`;
    await this.s3Service.uploadFile(s3Key, dto.fileBuffer, dto.contentType);

    const material = new Material(
      id,
      dto.title,
      dto.description,
      dto.classId,
      dto.uploadedBy,
      s3Key,
      dto.contentType,
      new Date(),
    );

    return this.materialRepository.create(material);
  }
}
