export class Prova {
  constructor(
    public readonly id: string,
    public readonly titulo: string,
    public readonly professorId: string,
    public readonly dataInicio: Date,
    public readonly dataFim: Date,
    public readonly duracaoMinutos: number,
    public readonly createdAt: Date,
  ) {}
}
