export class Certificate {
  constructor(
    public readonly id: string,
    public readonly enrollmentId: string,
    public s3Key: string,
    public readonly issuedAt: Date,
  ) {}
}
