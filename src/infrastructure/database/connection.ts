import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  // mysql2 retorna colunas DECIMAL como string por padrao; isso quebra o front
  // (ex.: grade.grade.toFixed). Forcamos numero para bater com os tipos.
  decimalNumbers: true,
  ssl: { rejectUnauthorized: false },
});
