export class TelemetriaScreenshot {
  constructor(
    public readonly id: string,
    public readonly alunoId: string,
    public readonly provaId: string,
    public readonly questaoId: string,
    public readonly s3Key: string,
    public readonly timestamp: number,
    public readonly horario: Date,
  ) {}
}
