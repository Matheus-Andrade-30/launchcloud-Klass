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

export interface RelatorioProva {
  provaId: string;
  totalAlunos: number;
  alertas: RelatorioAlerta[];
}

export interface RelatorioAlerta {
  alunoId: string;
  questaoId: string;
  tipo: string;
  detalhe: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
