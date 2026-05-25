import { RekognitionClient, DetectFacesCommand, CompareFacesCommand } from '@aws-sdk/client-rekognition';

interface FaceAnalysis {
  facesDetectadas: number;
  similarityScore: number | null;
  flags: string[];
}

export class RekognitionService {
  private client: RekognitionClient;
  private bucket: string;

  constructor() {
    this.client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
    this.bucket = process.env.S3_BUCKET_NAME || '';
  }

  async analyzeFace(imageS3Key: string, referenceS3Key?: string): Promise<FaceAnalysis> {
    const flags: string[] = [];

    const detectResult = await this.client.send(
      new DetectFacesCommand({
        Image: { S3Object: { Bucket: this.bucket, Name: imageS3Key } },
        Attributes: ['DEFAULT'],
      }),
    );

    const facesDetectadas = detectResult.FaceDetails?.length ?? 0;

    if (facesDetectadas === 0) flags.push('sem_rosto');
    if (facesDetectadas > 1) flags.push('multiplos_rostos');

    let similarityScore: number | null = null;

    if (referenceS3Key && facesDetectadas === 1) {
      try {
        const compareResult = await this.client.send(
          new CompareFacesCommand({
            SourceImage: { S3Object: { Bucket: this.bucket, Name: referenceS3Key } },
            TargetImage: { S3Object: { Bucket: this.bucket, Name: imageS3Key } },
            SimilarityThreshold: 0,
          }),
        );

        const match = compareResult.FaceMatches?.[0];
        similarityScore = match?.Similarity ?? 0;

        if (similarityScore < 80) flags.push('identidade_suspeita');
      } catch {
        flags.push('comparacao_falhou');
      }
    }

    return { facesDetectadas, similarityScore, flags };
  }
}
