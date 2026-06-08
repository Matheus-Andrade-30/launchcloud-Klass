import type {
  User,
  Class,
  Enrollment,
  EnrollmentStatus,
  Material,
  Grade,
  Certificate,
  Prova,
  Questao,
} from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function read<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── seed data ──────────────────────────────────────────────────────────────

const SEED_USERS: User[] = [
  { id: 'u-t1', name: 'Carlos Mendes',    email: 'carlos.mendes@klass.edu',          role: 'teacher', createdAt: '2024-01-10T00:00:00.000Z' },
  { id: 'u-t2', name: 'Ana Souza',        email: 'ana.souza@klass.edu',              role: 'teacher', createdAt: '2024-01-15T00:00:00.000Z' },
  { id: 'u-t3', name: 'Roberto Lima',     email: 'roberto.lima@klass.edu',           role: 'teacher', createdAt: '2024-02-01T00:00:00.000Z' },
  { id: 'u-s1', name: 'Lucas Oliveira',   email: 'lucas.oliveira@aluno.klass.edu',   role: 'student', createdAt: '2024-02-10T00:00:00.000Z' },
  { id: 'u-s2', name: 'Mariana Costa',    email: 'mariana.costa@aluno.klass.edu',    role: 'student', createdAt: '2024-02-11T00:00:00.000Z' },
  { id: 'u-s3', name: 'Pedro Alves',      email: 'pedro.alves@aluno.klass.edu',      role: 'student', createdAt: '2024-02-12T00:00:00.000Z' },
  { id: 'u-s4', name: 'Juliana Ferreira', email: 'juliana.ferreira@aluno.klass.edu', role: 'student', createdAt: '2024-02-13T00:00:00.000Z' },
  { id: 'u-s5', name: 'Rafael Santos',    email: 'rafael.santos@aluno.klass.edu',    role: 'student', createdAt: '2024-02-14T00:00:00.000Z' },
  { id: 'u-s6', name: 'Beatriz Rocha',    email: 'beatriz.rocha@aluno.klass.edu',    role: 'student', createdAt: '2024-02-15T00:00:00.000Z' },
  { id: 'u-s7', name: 'Felipe Nunes',     email: 'felipe.nunes@aluno.klass.edu',     role: 'student', createdAt: '2024-02-16T00:00:00.000Z' },
  { id: 'u-s8', name: 'Camila Martins',   email: 'camila.martins@aluno.klass.edu',   role: 'student', createdAt: '2024-02-17T00:00:00.000Z' },
];

const SEED_CLASSES: Class[] = [
  { id: 'c-1',  title: 'Matemática Avançada',     description: 'Cálculo diferencial e integral',    teacherId: 'u-t1', createdAt: '2024-03-01T00:00:00.000Z' },
  { id: 'c-2',  title: 'Física Quântica',          description: 'Introdução à mecânica quântica',   teacherId: 'u-t1', createdAt: '2024-03-02T00:00:00.000Z' },
  { id: 'c-3',  title: 'Programação Web',          description: 'HTML, CSS e JavaScript modernos',  teacherId: 'u-t2', createdAt: '2024-03-03T00:00:00.000Z' },
  { id: 'c-4',  title: 'Banco de Dados',           description: 'SQL e modelagem relacional',        teacherId: 'u-t2', createdAt: '2024-03-04T00:00:00.000Z' },
  { id: 'c-5',  title: 'Algoritmos',               description: 'Estruturas de dados e complexidade',teacherId: 'u-t3', createdAt: '2024-03-05T00:00:00.000Z' },
  { id: 'c-6',  title: 'Engenharia de Software',   description: 'Metodologias ágeis e clean code',  teacherId: 'u-t3', createdAt: '2024-03-06T00:00:00.000Z' },
  { id: 'c-7',  title: 'Redes de Computadores',    description: 'TCP/IP e protocolos de rede',       teacherId: 'u-t1', createdAt: '2024-03-07T00:00:00.000Z' },
  { id: 'c-8',  title: 'Inteligência Artificial',  description: 'Machine learning e deep learning',  teacherId: 'u-t2', createdAt: '2024-03-08T00:00:00.000Z' },
  { id: 'c-9',  title: 'Cloud Computing',          description: 'AWS e arquiteturas na nuvem',       teacherId: 'u-t3', createdAt: '2024-03-09T00:00:00.000Z' },
  { id: 'c-10', title: 'Segurança da Informação',  description: 'Criptografia e proteção de dados',  teacherId: 'u-t1', createdAt: '2024-03-10T00:00:00.000Z' },
];

const SEED_ENROLLMENTS: Enrollment[] = [
  { id: 'e-1',  studentId: 'u-s1', classId: 'c-1',  status: 'active',    enrolledAt: '2024-03-10T00:00:00.000Z' },
  { id: 'e-2',  studentId: 'u-s1', classId: 'c-3',  status: 'active',    enrolledAt: '2024-03-10T00:00:00.000Z' },
  { id: 'e-3',  studentId: 'u-s2', classId: 'c-1',  status: 'active',    enrolledAt: '2024-03-11T00:00:00.000Z' },
  { id: 'e-4',  studentId: 'u-s2', classId: 'c-5',  status: 'active',    enrolledAt: '2024-03-11T00:00:00.000Z' },
  { id: 'e-5',  studentId: 'u-s3', classId: 'c-3',  status: 'completed', enrolledAt: '2024-03-12T00:00:00.000Z' },
  { id: 'e-6',  studentId: 'u-s3', classId: 'c-6',  status: 'active',    enrolledAt: '2024-03-12T00:00:00.000Z' },
  { id: 'e-7',  studentId: 'u-s4', classId: 'c-2',  status: 'active',    enrolledAt: '2024-03-13T00:00:00.000Z' },
  { id: 'e-8',  studentId: 'u-s4', classId: 'c-9',  status: 'active',    enrolledAt: '2024-03-13T00:00:00.000Z' },
  { id: 'e-9',  studentId: 'u-s5', classId: 'c-4',  status: 'active',    enrolledAt: '2024-03-14T00:00:00.000Z' },
  { id: 'e-10', studentId: 'u-s5', classId: 'c-8',  status: 'dropped',   enrolledAt: '2024-03-14T00:00:00.000Z' },
  { id: 'e-11', studentId: 'u-s6', classId: 'c-7',  status: 'active',    enrolledAt: '2024-03-15T00:00:00.000Z' },
  { id: 'e-12', studentId: 'u-s7', classId: 'c-10', status: 'active',    enrolledAt: '2024-03-16T00:00:00.000Z' },
];

const SEED_GRADES: Grade[] = [
  { id: 'g-1',  enrollmentId: 'e-1',  teacherId: 'u-t1', grade: 8.5, attendance: 90, notes: 'Ótimo desempenho em cálculo',           createdAt: '2024-06-01T00:00:00.000Z' },
  { id: 'g-2',  enrollmentId: 'e-2',  teacherId: 'u-t2', grade: 9.0, attendance: 95, notes: 'Excelente trabalho em programação web', createdAt: '2024-06-01T00:00:00.000Z' },
  { id: 'g-3',  enrollmentId: 'e-3',  teacherId: 'u-t1', grade: 7.0, attendance: 80, notes: 'Bom, mas pode melhorar em derivadas',   createdAt: '2024-06-02T00:00:00.000Z' },
  { id: 'g-4',  enrollmentId: 'e-4',  teacherId: 'u-t3', grade: 8.0, attendance: 85, notes: 'Domínio sólido de algoritmos',          createdAt: '2024-06-02T00:00:00.000Z' },
  { id: 'g-5',  enrollmentId: 'e-5',  teacherId: 'u-t2', grade: 9.5, attendance: 98, notes: 'Curso concluído com distinção',         createdAt: '2024-06-03T00:00:00.000Z' },
  { id: 'g-6',  enrollmentId: 'e-6',  teacherId: 'u-t3', grade: 8.0, attendance: 88, notes: 'Bom entendimento de metodologias',      createdAt: '2024-06-03T00:00:00.000Z' },
  { id: 'g-7',  enrollmentId: 'e-7',  teacherId: 'u-t1', grade: 6.5, attendance: 75, notes: 'Precisa revisar mecânica quântica',     createdAt: '2024-06-04T00:00:00.000Z' },
  { id: 'g-8',  enrollmentId: 'e-8',  teacherId: 'u-t3', grade: 9.0, attendance: 92, notes: 'Excelente na parte de cloud',           createdAt: '2024-06-04T00:00:00.000Z' },
  { id: 'g-9',  enrollmentId: 'e-9',  teacherId: 'u-t2', grade: 7.5, attendance: 82, notes: 'Bom em SQL, fraco em normalização',     createdAt: '2024-06-05T00:00:00.000Z' },
  { id: 'g-11', enrollmentId: 'e-11', teacherId: 'u-t1', grade: 8.5, attendance: 91, notes: 'Bom domínio de TCP/IP',                 createdAt: '2024-06-06T00:00:00.000Z' },
  { id: 'g-12', enrollmentId: 'e-12', teacherId: 'u-t1', grade: 7.0, attendance: 78, notes: 'Em progresso em segurança',             createdAt: '2024-06-07T00:00:00.000Z' },
];

const SEED_PROVAS: Prova[] = [
  { id: 'p-1', titulo: 'Prova Final de Matemática',    professorId: 'u-t1', dataInicio: '2025-01-01T08:00:00.000Z', dataFim: '2030-12-31T23:59:00.000Z', duracaoMinutos: 90, createdAt: '2024-11-01T00:00:00.000Z' },
  { id: 'p-2', titulo: 'Avaliação de Programação Web', professorId: 'u-t2', dataInicio: '2025-01-01T08:00:00.000Z', dataFim: '2030-12-31T23:59:00.000Z', duracaoMinutos: 60, createdAt: '2024-11-02T00:00:00.000Z' },
];

const SEED_QUESTOES: Questao[] = [
  { id: 'q-1', provaId: 'p-1', enunciado: 'Calcule a derivada de f(x) = x² + 3x - 5.',             tipo: 'dissertativa',    pontuacao: 3, ordem: 1, createdAt: '2024-11-01T00:00:00.000Z' },
  { id: 'q-2', provaId: 'p-1', enunciado: 'Resolva a integral definida de 0 a 1 de 2x dx.',        tipo: 'dissertativa',    pontuacao: 3, ordem: 2, createdAt: '2024-11-01T00:00:00.000Z' },
  { id: 'q-3', provaId: 'p-1', enunciado: 'Qual o limite de (x²-1)/(x-1) quando x tende a 1?',    tipo: 'multipla_escolha', pontuacao: 4, ordem: 3, opcoes: ['1', '2', '0', 'Não existe'], createdAt: '2024-11-01T00:00:00.000Z' },
  { id: 'q-4', provaId: 'p-2', enunciado: 'Explique a diferença entre CSS Grid e Flexbox.',        tipo: 'dissertativa',    pontuacao: 5, ordem: 1, createdAt: '2024-11-02T00:00:00.000Z' },
  { id: 'q-5', provaId: 'p-2', enunciado: 'Escreva uma função JavaScript que retorna a soma de um array.', tipo: 'dissertativa', pontuacao: 5, ordem: 2, createdAt: '2024-11-02T00:00:00.000Z' },
];

// ─── initialise stores once ──────────────────────────────────────────────────

function init() {
  if (localStorage.getItem('klass_init') !== '2') {
    write('klass_users',       SEED_USERS);
    write('klass_classes',     SEED_CLASSES);
    write('klass_enrollments', SEED_ENROLLMENTS);
    write('klass_grades',      SEED_GRADES);
    write('klass_materials',   [] as Material[]);
    write('klass_certificates',[] as Certificate[]);
    write('klass_provas',      SEED_PROVAS);
    write('klass_questoes',    SEED_QUESTOES);
    localStorage.setItem('klass_init', '2');
  }
}
init();

// ─── generic store factory ───────────────────────────────────────────────────

function store<T extends { id: string }>(key: string) {
  return {
    list: (): T[] => read<T>(key, []),

    findById: (id: string): T | null =>
      read<T>(key, []).find((x) => x.id === id) ?? null,

    create: (item: T): T => {
      const all = read<T>(key, []);
      all.push(item);
      write(key, all);
      return item;
    },

    update: (id: string, patch: Partial<T>): T => {
      const all = read<T>(key, []);
      const idx = all.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`${key}: id ${id} not found`);
      all[idx] = { ...all[idx], ...patch };
      write(key, all);
      return all[idx];
    },

    remove: (id: string): void => {
      write(key, read<T>(key, []).filter((x) => x.id !== id));
    },
  };
}

// ─── typed stores ────────────────────────────────────────────────────────────

export const userStore       = store<User>('klass_users');
export const classStore      = store<Class>('klass_classes');
export const enrollmentStore = store<Enrollment>('klass_enrollments');
export const materialStore   = store<Material>('klass_materials');
export const gradeStore      = store<Grade>('klass_grades');
export const certStore       = store<Certificate>('klass_certificates');
export const provaStore      = store<Prova>('klass_provas');
export const questaoStore    = store<Questao>('klass_questoes');

export { uuid };
