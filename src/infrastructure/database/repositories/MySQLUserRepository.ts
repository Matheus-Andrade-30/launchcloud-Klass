import { RowDataPacket } from 'mysql2';
import { User } from '../../../domain/User';
import { IUserRepository } from '../../../domain/IUserRepository';
import { pool } from '../connection';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  created_at: Date;
}

export class MySQLUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    await pool.execute(
      'INSERT INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, user.role, user.createdAt],
    );
    return user;
  }

  async findAll(): Promise<User[]> {
    const [rows] = await pool.execute<UserRow[]>('SELECT * FROM users');
    return rows.map((r) => new User(r.id, r.name, r.email, r.role, r.created_at));
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User(r.id, r.name, r.email, r.role, r.created_at);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new User(r.id, r.name, r.email, r.role, r.created_at);
  }
}
