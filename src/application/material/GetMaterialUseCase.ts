import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { S3Service } from '../../infrastructure/services/S3Service';

interface MaterialWithUrl {
  id: string;
  title: string;
  description: string;
  classId: string;
  uploadedBy: string;
  contentType: string;
  uploadedAt: Date;
  downloadUrl: string;
}

export class GetMaterialUseCase {
  constructor(
    private materialRepository: IMaterialRepository,
    private s3Service: S3Service,
  ) {}

  async execute(id: string): Promise<MaterialWithUrl> {
    const material = await this.materialRepository.findById(id);
    if (!material) throw new Error('Material not found');

    const downloadUrl = await this.s3Service.getPresignedDownloadUrl(material.s3Key);

    return {
      id: material.id,
      title: material.title,
      description: material.description,
      classId: material.classId,
      uploadedBy: material.uploadedBy,
      contentType: material.contentType,
      uploadedAt: material.uploadedAt,
      downloadUrl,
    };
  }
}
