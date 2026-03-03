export class Enrollment {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly classId: string,
    public status: 'active' | 'completed' | 'dropped',
    public readonly enrolledAt: Date,
  ) {}
}
