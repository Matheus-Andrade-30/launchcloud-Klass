export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
}

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  classId: string;
  uploadedBy: string;
  s3Key: string;
  contentType: string;
  uploadedAt: string;
}

export interface Grade {
  id: string;
  enrollmentId: string;
  teacherId: string;
  grade: number;
  attendance: number;
  notes: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  s3Key: string;
  issuedAt: string;
}

export type QuestaoTipo = 'dissertativa' | 'multipla_escolha';

export interface Questao {
  id: string;
  provaId: string;
  enunciado: string;
  tipo: QuestaoTipo;
  pontuacao: number;
  ordem: number;
  opcoes?: string[];
  createdAt: string;
}

export interface Prova {
  id: string;
  titulo: string;
  professorId: string;
  dataInicio: string;
  dataFim: string;
  duracaoMinutos: number;
  questoes?: Questao[];
  createdAt: string;
  iniciadoEm?: string | null;
  finalizadoEm?: string | null;
}

export interface TelemetriaResultado {
  id: string;
  alunoId: string;
  provaId: string;
  questaoId: string;
  s3Key: string;
  timestamp: number;
  horario: string;
}

export interface RespostaVersao {
  id: string;
  alunoId: string;
  provaId: string;
  questaoId: string;
  versaoNum: number;
  charCount: number;
  lineCount: number;
  deltaChars: number;
  suspeito: boolean;
  timestamp: string;
  horario: string;
}

export type NivelRisco = 'baixo' | 'medio' | 'alto';

export interface EventoFraude {
  tipo: string;
  questaoId: string;
  horario: string;
  s3Key: string;
  detalhes: Record<string, unknown>;
}

export interface RelatorioAluno {
  alunoId: string;
  totalVersoesSuspeitas: number;
  totalFotosComFlags: number;
  totalScreenshots: number;
  eventos: EventoFraude[];
  nivelRisco: NivelRisco;
}

export interface RelatorioProva {
  provaId: string;
  titulo: string;
  geradoEm: string;
  totalAlunos: number;
  alunosComAlerta: number;
  alunos: RelatorioAluno[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
