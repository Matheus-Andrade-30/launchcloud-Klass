export class TelemetriaPhotocam {
  constructor(
    public readonly id: string,
    public readonly alunoId: string,
    public readonly provaId: string,
    public readonly questaoId: string,
    public readonly s3Key: string,
    public readonly facesDetectadas: number,
    public readonly similarityScore: number | null,
    public readonly flags: string[],
    public readonly timestamp: number,
    public readonly horario: Date,
  ) {}
}
