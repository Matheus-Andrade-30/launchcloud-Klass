export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public role: 'teacher' | 'student',
    public readonly createdAt: Date,
  ) {}
}
