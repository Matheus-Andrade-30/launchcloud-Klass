export class Material {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public readonly classId: string,
    public readonly uploadedBy: string,
    public s3Key: string,
    public contentType: string,
    public readonly uploadedAt: Date,
  ) {}
}
