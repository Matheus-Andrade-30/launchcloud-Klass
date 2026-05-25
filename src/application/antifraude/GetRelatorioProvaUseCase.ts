import { IRespostaVersaoRepository } from '../../domain/IRespostaVersaoRepository';
import { ITelemetriaPhotocamRepository } from '../../domain/ITelemetriaPhotocamRepository';
import { ITelemetriaScreenshotRepository } from '../../domain/ITelemetriaScreenshotRepository';
import { IProvaRepository } from '../../domain/IProvaRepository';

interface EventoFraude {
  tipo: string;
  questaoId: string;
  horario: Date;
  s3Key: string;
  detalhes: Record<string, unknown>;
}

interface RelatorioAluno {
  alunoId: string;
  totalVersoesSuspeitas: number;
  totalFotosComFlags: number;
  totalScreenshots: number;
  eventos: EventoFraude[];
  nivelRisco: 'baixo' | 'medio' | 'alto';
}

interface RelatorioProva {
  provaId: string;
  titulo: string;
  geradoEm: string;
  totalAlunos: number;
  alunosComAlerta: number;
  alunos: RelatorioAluno[];
}

export class GetRelatorioProvaUseCase {
  constructor(
    private provaRepository: IProvaRepository,
    private respostaRepository: IRespostaVersaoRepository,
    private photocamRepository: ITelemetriaPhotocamRepository,
    private screenshotRepository: ITelemetriaScreenshotRepository,
  ) {}

  async execute(provaId: string): Promise<RelatorioProva> {
    const prova = await this.provaRepository.findById(provaId);
    if (!prova) throw new Error('Prova não encontrada');

    const [suspeitosResposta, fotosComFlags] = await Promise.all([
      this.respostaRepository.findSuspeitosByProvaId(provaId),
      this.photocamRepository.findComFlagsByProvaId(provaId),
    ]);

    const alunosSet = new Set<string>([
      ...suspeitosResposta.map((r) => r.alunoId),
      ...fotosComFlags.map((f) => f.alunoId),
    ]);

    const alunosRelatorio: RelatorioAluno[] = await Promise.all(
      Array.from(alunosSet).map(async (alunoId) => {
        const respostasAluno = suspeitosResposta.filter((r) => r.alunoId === alunoId);
        const fotosAluno = fotosComFlags.filter((f) => f.alunoId === alunoId);
        const totalScreenshots = await this.screenshotRepository.countByProvaIdAndAlunoId(provaId, alunoId);

        const eventos: EventoFraude[] = [
          ...respostasAluno.map((r) => ({
            tipo: 'cola_detectada',
            questaoId: r.questaoId,
            horario: r.horario,
            s3Key: r.s3Key,
            detalhes: {
              versaoNum: r.versaoNum,
              deltaChars: r.deltaChars,
              charCount: r.charCount,
              lineCount: r.lineCount,
            },
          })),
          ...fotosAluno.flatMap((f) =>
            f.flags.map((flag) => ({
              tipo: flag,
              questaoId: f.questaoId,
              horario: f.horario,
              s3Key: f.s3Key,
              detalhes: {
                facesDetectadas: f.facesDetectadas,
                similarityScore: f.similarityScore,
              },
            })),
          ),
        ].sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime());

        const totalFlags = respostasAluno.length + fotosAluno.reduce((acc, f) => acc + f.flags.length, 0);
        const nivelRisco: 'baixo' | 'medio' | 'alto' =
          totalFlags >= 5 ? 'alto' : totalFlags >= 2 ? 'medio' : 'baixo';

        return {
          alunoId,
          totalVersoesSuspeitas: respostasAluno.length,
          totalFotosComFlags: fotosAluno.length,
          totalScreenshots,
          eventos,
          nivelRisco,
        };
      }),
    );

    alunosRelatorio.sort((a, b) => {
      const ordem = { alto: 0, medio: 1, baixo: 2 };
      return ordem[a.nivelRisco] - ordem[b.nivelRisco];
    });

    return {
      provaId,
      titulo: prova.titulo,
      geradoEm: new Date().toISOString(),
      totalAlunos: alunosSet.size,
      alunosComAlerta: alunosRelatorio.filter((a) => a.nivelRisco !== 'baixo').length,
      alunos: alunosRelatorio,
    };
  }
}
