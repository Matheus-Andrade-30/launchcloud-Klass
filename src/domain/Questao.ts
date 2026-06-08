export class Questao {
  constructor(
    public readonly id: string,
    public readonly provaId: string,
    public readonly enunciado: string,
    public readonly tipo: 'dissertativa' | 'multipla_escolha',
    public readonly pontuacao: number,
    public readonly ordem: number,
    public readonly createdAt: Date,
    public readonly opcoes: string[] | null = null,
  ) {}
}
