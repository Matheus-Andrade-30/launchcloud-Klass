import { User } from '../../domain/User';
import { Class } from '../../domain/Class';
import { Enrollment } from '../../domain/Enrollment';
import { InMemoryUserRepository } from './repositories/InMemoryUserRepository';
import { InMemoryClassRepository } from './repositories/InMemoryClassRepository';
import { InMemoryEnrollmentRepository } from './repositories/InMemoryEnrollmentRepository';

export function seedDatabase(
  userRepo: InMemoryUserRepository,
  classRepo: InMemoryClassRepository,
  enrollmentRepo: InMemoryEnrollmentRepository,
): void {
  const teachers = [
    new User('u-t1', 'Carlos Mendes', 'carlos.mendes@klass.edu', 'teacher', new Date('2024-01-10')),
    new User('u-t2', 'Ana Souza', 'ana.souza@klass.edu', 'teacher', new Date('2024-01-15')),
    new User('u-t3', 'Roberto Lima', 'roberto.lima@klass.edu', 'teacher', new Date('2024-02-01')),
  ];

  const students = [
    new User('u-s1', 'Lucas Oliveira', 'lucas.oliveira@aluno.klass.edu', 'student', new Date('2024-02-10')),
    new User('u-s2', 'Mariana Costa', 'mariana.costa@aluno.klass.edu', 'student', new Date('2024-02-11')),
    new User('u-s3', 'Pedro Alves', 'pedro.alves@aluno.klass.edu', 'student', new Date('2024-02-12')),
    new User('u-s4', 'Juliana Ferreira', 'juliana.ferreira@aluno.klass.edu', 'student', new Date('2024-02-13')),
    new User('u-s5', 'Rafael Santos', 'rafael.santos@aluno.klass.edu', 'student', new Date('2024-02-14')),
    new User('u-s6', 'Beatriz Rocha', 'beatriz.rocha@aluno.klass.edu', 'student', new Date('2024-02-15')),
    new User('u-s7', 'Felipe Nunes', 'felipe.nunes@aluno.klass.edu', 'student', new Date('2024-02-16')),
    new User('u-s8', 'Camila Martins', 'camila.martins@aluno.klass.edu', 'student', new Date('2024-02-17')),
  ];

  userRepo.seed([...teachers, ...students]);

  const classes = [
    new Class('c-1', 'Matemática Avançada', 'Cálculo diferencial e integral', 'u-t1', new Date('2024-03-01')),
    new Class('c-2', 'Física Quântica', 'Introdução à mecânica quântica', 'u-t1', new Date('2024-03-02')),
    new Class('c-3', 'Programação Web', 'HTML, CSS e JavaScript modernos', 'u-t2', new Date('2024-03-03')),
    new Class('c-4', 'Banco de Dados', 'SQL e modelagem relacional', 'u-t2', new Date('2024-03-04')),
    new Class('c-5', 'Algoritmos', 'Estruturas de dados e complexidade', 'u-t3', new Date('2024-03-05')),
    new Class('c-6', 'Engenharia de Software', 'Metodologias ágeis e clean code', 'u-t3', new Date('2024-03-06')),
    new Class('c-7', 'Redes de Computadores', 'TCP/IP e protocolos de rede', 'u-t1', new Date('2024-03-07')),
    new Class('c-8', 'Inteligência Artificial', 'Machine learning e deep learning', 'u-t2', new Date('2024-03-08')),
    new Class('c-9', 'Cloud Computing', 'AWS e arquiteturas na nuvem', 'u-t3', new Date('2024-03-09')),
    new Class('c-10', 'Segurança da Informação', 'Criptografia e proteção de dados', 'u-t1', new Date('2024-03-10')),
  ];

  classRepo.seed(classes);

  const enrollments = [
    new Enrollment('e-1', 'u-s1', 'c-1', 'active', new Date('2024-03-10')),
    new Enrollment('e-2', 'u-s1', 'c-3', 'active', new Date('2024-03-10')),
    new Enrollment('e-3', 'u-s2', 'c-1', 'active', new Date('2024-03-11')),
    new Enrollment('e-4', 'u-s2', 'c-5', 'active', new Date('2024-03-11')),
    new Enrollment('e-5', 'u-s3', 'c-3', 'completed', new Date('2024-03-12')),
    new Enrollment('e-6', 'u-s3', 'c-6', 'active', new Date('2024-03-12')),
    new Enrollment('e-7', 'u-s4', 'c-2', 'active', new Date('2024-03-13')),
    new Enrollment('e-8', 'u-s4', 'c-9', 'active', new Date('2024-03-13')),
    new Enrollment('e-9', 'u-s5', 'c-4', 'active', new Date('2024-03-14')),
    new Enrollment('e-10', 'u-s5', 'c-8', 'dropped', new Date('2024-03-14')),
    new Enrollment('e-11', 'u-s6', 'c-7', 'active', new Date('2024-03-15')),
    new Enrollment('e-12', 'u-s7', 'c-10', 'active', new Date('2024-03-16')),
  ];

  enrollmentRepo.seed(enrollments);

  console.log('Database seeded: 11 users, 10 classes, 12 enrollments');
}
