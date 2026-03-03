export class Class {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public readonly teacherId: string,
    public readonly createdAt: Date,
  ) {}
}
