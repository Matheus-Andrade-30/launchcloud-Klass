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

    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users');
    const count = (rows as { count: number }[])[0].count;

    if (count === 0) {
      await conn.execute(`
        INSERT INTO users (id, name, email, role, created_at) VALUES
        ('u-t1', 'Carlos Mendes',   'carlos.mendes@klass.edu',              'teacher', '2024-01-10'),
        ('u-t2', 'Ana Souza',       'ana.souza@klass.edu',                  'teacher', '2024-01-15'),
        ('u-t3', 'Roberto Lima',    'roberto.lima@klass.edu',               'teacher', '2024-02-01'),
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

      console.log('Database seeded: 11 users, 10 classes, 12 enrollments');
    }

    console.log('Database initialized successfully');
  } finally {
    conn.release();
  }
}
