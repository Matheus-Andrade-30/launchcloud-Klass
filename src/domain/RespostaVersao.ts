export class RespostaVersao {
  constructor(
    public readonly id: string,
    public readonly alunoId: string,
    public readonly provaId: string,
    public readonly questaoId: string,
    public readonly versaoNum: number,
    public readonly s3Key: string,
    public readonly charCount: number,
    public readonly lineCount: number,
    public readonly deltaChars: number,
    public readonly suspeito: boolean,
    public readonly timestamp: number,
    public readonly horario: Date,
  ) {}
}
