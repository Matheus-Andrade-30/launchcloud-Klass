import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { pool } from './connection';

dotenv.config();

export async function initDatabase(): Promise<void> {
  const tempConn = await mysql.createConnection({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: { rejectUnauthorized: false },
  });
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await tempConn.end();

  const conn = await pool.getConnection();

  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role ENUM('teacher', 'student') NOT NULL,
        created_at DATETIME NOT NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        teacher_id VARCHAR(36) NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id VARCHAR(36) PRIMARY KEY,
        student_id VARCHAR(36) NOT NULL,
        class_id VARCHAR(36) NOT NULL,
        status ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active',
        enrolled_at DATETIME NOT NULL,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        class_id VARCHAR(36) NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        s3_key VARCHAR(1024) NOT NULL,
        content_type VARCHAR(255) NOT NULL,
        uploaded_at DATETIME NOT NULL,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS grades (
        id VARCHAR(36) PRIMARY KEY,
        enrollment_id VARCHAR(36) NOT NULL,
        teacher_id VARCHAR(36) NOT NULL,
        grade DECIMAL(4,2) NOT NULL,
        attendance DECIMAL(5,2) NOT NULL,
        notes TEXT,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR(36) PRIMARY KEY,
        enrollment_id VARCHAR(36) NOT NULL UNIQUE,
        s3_key VARCHAR(1024) NOT NULL,
        issued_at DATETIME NOT NULL,
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
      )
    `);

    // Tabelas do módulo antifraude (criadas antes do seed para garantir ordem correta)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS provas (
        id VARCHAR(36) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        professor_id VARCHAR(36) NOT NULL,
        data_inicio DATETIME NOT NULL,
        data_fim DATETIME NOT NULL,
        duracao_minutos INT NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (professor_id) REFERENCES users(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS questoes (
        id VARCHAR(36) PRIMARY KEY,
        prova_id VARCHAR(36) NOT NULL,
        enunciado TEXT NOT NULL,
        tipo ENUM('dissertativa', 'multipla_escolha') NOT NULL DEFAULT 'dissertativa',
        pontuacao DECIMAL(5,2) NOT NULL,
        ordem INT NOT NULL,
        created_at DATETIME NOT NULL,
        opcoes JSON NULL,
        FOREIGN KEY (prova_id) REFERENCES provas(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS provas_alunos (
        id VARCHAR(36) PRIMARY KEY,
        prova_id VARCHAR(36) NOT NULL,
        aluno_id VARCHAR(36) NOT NULL,
        iniciado_em DATETIME NULL,
        finalizado_em DATETIME NULL,
        UNIQUE KEY unique_matricula (prova_id, aluno_id),
        FOREIGN KEY (prova_id) REFERENCES provas(id),
        FOREIGN KEY (aluno_id) REFERENCES users(id)
      )
    `);

    // ALTER defensivo para bancos já existentes (MySQL não suporta ADD COLUMN IF NOT EXISTS).
    try {
      await conn.execute('ALTER TABLE provas_alunos ADD COLUMN iniciado_em DATETIME NULL');
    } catch {
      // Coluna já existe — ignora erro de coluna duplicada.
    }
    try {
      await conn.execute('ALTER TABLE provas_alunos ADD COLUMN finalizado_em DATETIME NULL');
    } catch {
      // Coluna já existe.
    }
    try {
      await conn.execute('ALTER TABLE questoes ADD COLUMN opcoes JSON NULL');
    } catch {
      // Coluna já existe.
    }

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS respostas_versoes (
        id VARCHAR(36) PRIMARY KEY,
        aluno_id VARCHAR(36) NOT NULL,
        prova_id VARCHAR(36) NOT NULL,
        questao_id VARCHAR(36) NOT NULL,
        versao_num INT NOT NULL,
        s3_key VARCHAR(1024) NOT NULL,
        char_count INT NOT NULL DEFAULT 0,
        line_count INT NOT NULL DEFAULT 0,
        delta_chars INT NOT NULL DEFAULT 0,
        suspeito BOOLEAN NOT NULL DEFAULT FALSE,
        timestamp BIGINT NOT NULL,
        horario DATETIME NOT NULL,
        FOREIGN KEY (aluno_id) REFERENCES users(id),
        FOREIGN KEY (prova_id) REFERENCES provas(id),
        FOREIGN KEY (questao_id) REFERENCES questoes(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS telemetria_photocam (
        id VARCHAR(36) PRIMARY KEY,
        aluno_id VARCHAR(36) NOT NULL,
        prova_id VARCHAR(36) NOT NULL,
        questao_id VARCHAR(36) NOT NULL,
        s3_key VARCHAR(1024) NOT NULL,
        faces_detectadas INT NOT NULL DEFAULT 0,
        similarity_score DECIMAL(5,2),
        flags JSON,
        timestamp BIGINT NOT NULL,
        horario DATETIME NOT NULL,
        FOREIGN KEY (aluno_id) REFERENCES users(id),
        FOREIGN KEY (prova_id) REFERENCES provas(id),
        FOREIGN KEY (questao_id) REFERENCES questoes(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS telemetria_screenshot (
        id VARCHAR(36) PRIMARY KEY,
        aluno_id VARCHAR(36) NOT NULL,
        prova_id VARCHAR(36) NOT NULL,
        questao_id VARCHAR(36) NOT NULL,
        s3_key VARCHAR(1024) NOT NULL,
        timestamp BIGINT NOT NULL,
        horario DATETIME NOT NULL,
        FOREIGN KEY (aluno_id) REFERENCES users(id),
        FOREIGN KEY (prova_id) REFERENCES provas(id),
        FOREIGN KEY (questao_id) REFERENCES questoes(id)
      )
    `);

    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users');
    const count = (rows as { count: number }[])[0].count;

    if (count === 0) {
      await conn.execute(`
        INSERT INTO users (id, name, email, role, created_at) VALUES
        ('u-t1', 'Carlos Mendes',   'carlos.mendes@klass.edu',              'teacher', '2024-01-10'),
        ('u-t2', 'Ana Souza',       'ana.souza@klass.edu',                  'teacher', '2024-01-15'),
        ('u-t3', 'Roberto Lima',    'roberto.lima@klass.edu',               'teacher', '2024-02-01'),
        ('u-t4', 'Prof. Responsavel (Demo)', '202402630661@alunos.ibmec.edu.br', 'teacher', '2024-01-20'),
        ('u-s1', 'Lucas Oliveira',  'lucas.oliveira@aluno.klass.edu',       'student', '2024-02-10'),
        ('u-s2', 'Mariana Costa',   'mariana.costa@aluno.klass.edu',        'student', '2024-02-11'),
        ('u-s3', 'Pedro Alves',     'pedro.alves@aluno.klass.edu',          'student', '2024-02-12'),
        ('u-s4', 'Juliana Ferreira','juliana.ferreira@aluno.klass.edu',     'student', '2024-02-13'),
        ('u-s5', 'Rafael Santos',   'rafael.santos@aluno.klass.edu',        'student', '2024-02-14'),
        ('u-s6', 'Beatriz Rocha',   'beatriz.rocha@aluno.klass.edu',        'student', '2024-02-15'),
        ('u-s7', 'Felipe Nunes',    'felipe.nunes@aluno.klass.edu',         'student', '2024-02-16'),
        ('u-s8', 'Camila Martins',  'camila.martins@aluno.klass.edu',       'student', '2024-02-17')
      `);

      await conn.execute(`
        INSERT INTO classes (id, title, description, teacher_id, created_at) VALUES
        ('c-1',  'Matemática Avançada',      'Cálculo diferencial e integral',      'u-t1', '2024-03-01'),
        ('c-2',  'Física Quântica',          'Introdução à mecânica quântica',      'u-t1', '2024-03-02'),
        ('c-3',  'Programação Web',          'HTML, CSS e JavaScript modernos',     'u-t2', '2024-03-03'),
        ('c-4',  'Banco de Dados',           'SQL e modelagem relacional',          'u-t2', '2024-03-04'),
        ('c-5',  'Algoritmos',              'Estruturas de dados e complexidade',   'u-t3', '2024-03-05'),
        ('c-6',  'Engenharia de Software',   'Metodologias ágeis e clean code',     'u-t3', '2024-03-06'),
        ('c-7',  'Redes de Computadores',    'TCP/IP e protocolos de rede',         'u-t1', '2024-03-07'),
        ('c-8',  'Inteligência Artificial',  'Machine learning e deep learning',    'u-t2', '2024-03-08'),
        ('c-9',  'Cloud Computing',          'AWS e arquiteturas na nuvem',         'u-t3', '2024-03-09'),
        ('c-10', 'Segurança da Informação',  'Criptografia e proteção de dados',    'u-t1', '2024-03-10')
      `);

      await conn.execute(`
        INSERT INTO enrollments (id, student_id, class_id, status, enrolled_at) VALUES
        ('e-1',  'u-s1', 'c-1',  'active',    '2024-03-10'),
        ('e-2',  'u-s1', 'c-3',  'active',    '2024-03-10'),
        ('e-3',  'u-s2', 'c-1',  'active',    '2024-03-11'),
        ('e-4',  'u-s2', 'c-5',  'active',    '2024-03-11'),
        ('e-5',  'u-s3', 'c-3',  'completed', '2024-03-12'),
        ('e-6',  'u-s3', 'c-6',  'active',    '2024-03-12'),
        ('e-7',  'u-s4', 'c-2',  'active',    '2024-03-13'),
        ('e-8',  'u-s4', 'c-9',  'active',    '2024-03-13'),
        ('e-9',  'u-s5', 'c-4',  'active',    '2024-03-14'),
        ('e-10', 'u-s5', 'c-8',  'dropped',   '2024-03-14'),
        ('e-11', 'u-s6', 'c-7',  'active',    '2024-03-15'),
        ('e-12', 'u-s7', 'c-10', 'active',    '2024-03-16')
      `);

      await conn.execute(`
        INSERT INTO grades (id, enrollment_id, teacher_id, grade, attendance, notes, created_at) VALUES
        ('g-1',  'e-1',  'u-t1', 8.5, 90.0, 'Ótimo desempenho em cálculo',           '2024-06-01'),
        ('g-2',  'e-2',  'u-t2', 9.0, 95.0, 'Excelente trabalho em programação web', '2024-06-01'),
        ('g-3',  'e-3',  'u-t1', 7.0, 80.0, 'Bom, mas pode melhorar em derivadas',   '2024-06-02'),
        ('g-4',  'e-4',  'u-t3', 8.0, 85.0, 'Domínio sólido de algoritmos',          '2024-06-02'),
        ('g-5',  'e-5',  'u-t2', 9.5, 98.0, 'Curso concluído com distinção',         '2024-06-03'),
        ('g-6',  'e-6',  'u-t3', 8.0, 88.0, 'Bom entendimento de metodologias',      '2024-06-03'),
        ('g-7',  'e-7',  'u-t1', 6.5, 75.0, 'Precisa revisar mecânica quântica',     '2024-06-04'),
        ('g-8',  'e-8',  'u-t3', 9.0, 92.0, 'Excelente na parte de cloud',           '2024-06-04'),
        ('g-9',  'e-9',  'u-t2', 7.5, 82.0, 'Bom em SQL, fraco em normalização',     '2024-06-05'),
        ('g-11', 'e-11', 'u-t1', 8.5, 91.0, 'Bom domínio de TCP/IP',                 '2024-06-06'),
        ('g-12', 'e-12', 'u-t1', 7.0, 78.0, 'Em progresso em segurança',             '2024-06-07')
      `);

      await conn.execute(`
        INSERT INTO provas (id, titulo, professor_id, data_inicio, data_fim, duracao_minutos, created_at) VALUES
        ('p-1', 'Prova Final de Matemática',   'u-t4', '2025-01-01 08:00:00', '2030-12-31 23:59:00', 90, '2024-11-01'),
        ('p-2', 'Avaliação de Programação Web', 'u-t2', '2025-01-01 08:00:00', '2030-12-31 23:59:00', 60, '2024-11-02')
      `);

      await conn.execute(`
        INSERT INTO questoes (id, prova_id, enunciado, tipo, pontuacao, ordem, created_at) VALUES
        ('q-1', 'p-1', 'Calcule a derivada de f(x) = x² + 3x - 5.',              'dissertativa',    3.00, 1, '2024-11-01'),
        ('q-2', 'p-1', 'Resolva a integral definida de 0 a 1 de 2x dx.',         'dissertativa',    3.00, 2, '2024-11-01'),
        ('q-3', 'p-1', 'Qual é o limite de (x²-1)/(x-1) quando x tende a 1?',   'multipla_escolha',4.00, 3, '2024-11-01'),
        ('q-4', 'p-2', 'Explique a diferença entre CSS Grid e Flexbox.',          'dissertativa',    5.00, 1, '2024-11-02'),
        ('q-5', 'p-2', 'Escreva uma função JavaScript que retorna a soma de um array.', 'dissertativa',5.00, 2, '2024-11-02')
      `);

      await conn.execute(`
        INSERT INTO provas_alunos (id, prova_id, aluno_id) VALUES
        ('pa-1', 'p-1', 'u-s1'),
        ('pa-2', 'p-1', 'u-s2'),
        ('pa-3', 'p-1', 'u-s3'),
        ('pa-4', 'p-2', 'u-s1'),
        ('pa-5', 'p-2', 'u-s3')
      `);

      console.log(
        'Database seeded: 11 users, 10 classes, 12 enrollments, 11 grades, 2 provas, 5 questoes',
      );
    }

    console.log('Database initialized successfully');
  } finally {
    conn.release();
  }
}
