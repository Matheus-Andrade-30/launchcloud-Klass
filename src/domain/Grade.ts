export class Grade {
  constructor(
    public readonly id: string,
    public readonly enrollmentId: string,
    public readonly teacherId: string,
    public grade: number,
    public attendance: number,
    public notes: string,
    public readonly createdAt: Date,
  ) {}
}
