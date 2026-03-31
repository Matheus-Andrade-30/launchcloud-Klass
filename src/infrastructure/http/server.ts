import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { MySQLUserRepository } from '../database/repositories/MySQLUserRepository';
import { MySQLClassRepository } from '../database/repositories/MySQLClassRepository';
import { MySQLEnrollmentRepository } from '../database/repositories/MySQLEnrollmentRepository';
import { initDatabase } from '../database/initDatabase';

import { CreateUserUseCase } from '../../application/user/CreateUserUseCase';
import { ListUsersUseCase } from '../../application/user/ListUsersUseCase';
import { GetUserByIdUseCase } from '../../application/user/GetUserByIdUseCase';
import { CreateClassUseCase } from '../../application/class/CreateClassUseCase';
import { ListClassesUseCase } from '../../application/class/ListClassesUseCase';
import { GetClassByIdUseCase } from '../../application/class/GetClassByIdUseCase';
import { CreateEnrollmentUseCase } from '../../application/enrollment/CreateEnrollmentUseCase';
import { ListEnrollmentsUseCase } from '../../application/enrollment/ListEnrollmentsUseCase';
import { GetEnrollmentByIdUseCase } from '../../application/enrollment/GetEnrollmentByIdUseCase';

import { UserController } from './controllers/UserController';
import { ClassController } from './controllers/ClassController';
import { EnrollmentController } from './controllers/EnrollmentController';
import { userRoutes } from './routes/userRoutes';
import { classRoutes } from './routes/classRoutes';
import { enrollmentRoutes } from './routes/enrollmentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function bootstrap() {
  await initDatabase();

  // Repositories
  const userRepository = new MySQLUserRepository();
  const classRepository = new MySQLClassRepository();
  const enrollmentRepository = new MySQLEnrollmentRepository();

  // Use Cases
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);

  const createClassUseCase = new CreateClassUseCase(classRepository, userRepository);
  const listClassesUseCase = new ListClassesUseCase(classRepository);
  const getClassByIdUseCase = new GetClassByIdUseCase(classRepository);

  const createEnrollmentUseCase = new CreateEnrollmentUseCase(
    enrollmentRepository,
    userRepository,
    classRepository,
  );
  const listEnrollmentsUseCase = new ListEnrollmentsUseCase(enrollmentRepository);
  const getEnrollmentByIdUseCase = new GetEnrollmentByIdUseCase(enrollmentRepository);

  // Controllers
  const userController = new UserController(createUserUseCase, listUsersUseCase, getUserByIdUseCase);
  const classController = new ClassController(
    createClassUseCase,
    listClassesUseCase,
    getClassByIdUseCase,
  );
  const enrollmentController = new EnrollmentController(
    createEnrollmentUseCase,
    listEnrollmentsUseCase,
    getEnrollmentByIdUseCase,
  );

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use('/users', userRoutes(userController));
  app.use('/classes', classRoutes(classController));
  app.use('/enrollments', enrollmentRoutes(enrollmentController));

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
