import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { MySQLUserRepository } from '../database/repositories/MySQLUserRepository';
import { MySQLClassRepository } from '../database/repositories/MySQLClassRepository';
import { MySQLEnrollmentRepository } from '../database/repositories/MySQLEnrollmentRepository';
import { MySQLMaterialRepository } from '../database/repositories/MySQLMaterialRepository';
import { MySQLGradeRepository } from '../database/repositories/MySQLGradeRepository';
import { MySQLCertificateRepository } from '../database/repositories/MySQLCertificateRepository';
import { initDatabase } from '../database/initDatabase';

import { CreateUserUseCase } from '../../application/user/CreateUserUseCase';
import { ListUsersUseCase } from '../../application/user/ListUsersUseCase';
import { GetUserByIdUseCase } from '../../application/user/GetUserByIdUseCase';
import { UpdateUserUseCase } from '../../application/user/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../application/user/DeleteUserUseCase';

import { CreateClassUseCase } from '../../application/class/CreateClassUseCase';
import { ListClassesUseCase } from '../../application/class/ListClassesUseCase';
import { GetClassByIdUseCase } from '../../application/class/GetClassByIdUseCase';
import { UpdateClassUseCase } from '../../application/class/UpdateClassUseCase';
import { DeleteClassUseCase } from '../../application/class/DeleteClassUseCase';

import { CreateEnrollmentUseCase } from '../../application/enrollment/CreateEnrollmentUseCase';
import { ListEnrollmentsUseCase } from '../../application/enrollment/ListEnrollmentsUseCase';
import { GetEnrollmentByIdUseCase } from '../../application/enrollment/GetEnrollmentByIdUseCase';
import { UpdateEnrollmentStatusUseCase } from '../../application/enrollment/UpdateEnrollmentStatusUseCase';
import { DeleteEnrollmentUseCase } from '../../application/enrollment/DeleteEnrollmentUseCase';

import { CreateMaterialUseCase } from '../../application/material/CreateMaterialUseCase';
import { ListMaterialsUseCase } from '../../application/material/ListMaterialsUseCase';
import { ListMaterialsByClassUseCase } from '../../application/material/ListMaterialsByClassUseCase';
import { GetMaterialUseCase } from '../../application/material/GetMaterialUseCase';

import { CreateGradeUseCase } from '../../application/grade/CreateGradeUseCase';
import { ListGradesUseCase } from '../../application/grade/ListGradesUseCase';
import { GetGradeByIdUseCase } from '../../application/grade/GetGradeByIdUseCase';
import { ListGradesByEnrollmentUseCase } from '../../application/grade/ListGradesByEnrollmentUseCase';

import { GenerateCertificateUseCase } from '../../application/certificate/GenerateCertificateUseCase';
import { GetCertificateUseCase } from '../../application/certificate/GetCertificateUseCase';

import { S3Service } from '../services/S3Service';
import { LambdaService } from '../services/LambdaService';

import { UserController } from './controllers/UserController';
import { ClassController } from './controllers/ClassController';
import { EnrollmentController } from './controllers/EnrollmentController';
import { MaterialController } from './controllers/MaterialController';
import { GradeController } from './controllers/GradeController';
import { CertificateController } from './controllers/CertificateController';

import { userRoutes } from './routes/userRoutes';
import { classRoutes } from './routes/classRoutes';
import { enrollmentRoutes } from './routes/enrollmentRoutes';
import { materialRoutes } from './routes/materialRoutes';
import { gradeRoutes } from './routes/gradeRoutes';
import { certificateRoutes } from './routes/certificateRoutes';

import { swaggerSpec } from './swagger';

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
  const materialRepository = new MySQLMaterialRepository();
  const gradeRepository = new MySQLGradeRepository();
  const certificateRepository = new MySQLCertificateRepository();

  // Services
  const s3Service = new S3Service();
  const lambdaService = new LambdaService();

  // Use Cases — Users
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  // Use Cases — Classes
  const createClassUseCase = new CreateClassUseCase(classRepository, userRepository);
  const listClassesUseCase = new ListClassesUseCase(classRepository);
  const getClassByIdUseCase = new GetClassByIdUseCase(classRepository);
  const updateClassUseCase = new UpdateClassUseCase(classRepository);
  const deleteClassUseCase = new DeleteClassUseCase(classRepository);

  // Use Cases — Enrollments
  const createEnrollmentUseCase = new CreateEnrollmentUseCase(
    enrollmentRepository,
    userRepository,
    classRepository,
  );
  const listEnrollmentsUseCase = new ListEnrollmentsUseCase(enrollmentRepository);
  const getEnrollmentByIdUseCase = new GetEnrollmentByIdUseCase(enrollmentRepository);
  const updateEnrollmentStatusUseCase = new UpdateEnrollmentStatusUseCase(enrollmentRepository);
  const deleteEnrollmentUseCase = new DeleteEnrollmentUseCase(enrollmentRepository);

  // Use Cases — Materials
  const createMaterialUseCase = new CreateMaterialUseCase(
    materialRepository,
    classRepository,
    userRepository,
    s3Service,
  );
  const listMaterialsUseCase = new ListMaterialsUseCase(materialRepository);
  const listMaterialsByClassUseCase = new ListMaterialsByClassUseCase(
    materialRepository,
    classRepository,
  );
  const getMaterialUseCase = new GetMaterialUseCase(materialRepository, s3Service);

  // Use Cases — Grades
  const createGradeUseCase = new CreateGradeUseCase(
    gradeRepository,
    enrollmentRepository,
    userRepository,
  );
  const listGradesUseCase = new ListGradesUseCase(gradeRepository);
  const getGradeByIdUseCase = new GetGradeByIdUseCase(gradeRepository);
  const listGradesByEnrollmentUseCase = new ListGradesByEnrollmentUseCase(
    gradeRepository,
    enrollmentRepository,
  );

  // Use Cases — Certificates
  const generateCertificateUseCase = new GenerateCertificateUseCase(
    certificateRepository,
    enrollmentRepository,
    userRepository,
    classRepository,
    lambdaService,
    s3Service,
  );
  const getCertificateUseCase = new GetCertificateUseCase(certificateRepository, s3Service);

  // Controllers
  const userController = new UserController(
    createUserUseCase,
    listUsersUseCase,
    getUserByIdUseCase,
    updateUserUseCase,
    deleteUserUseCase,
  );
  const classController = new ClassController(
    createClassUseCase,
    listClassesUseCase,
    getClassByIdUseCase,
    updateClassUseCase,
    deleteClassUseCase,
  );
  const enrollmentController = new EnrollmentController(
    createEnrollmentUseCase,
    listEnrollmentsUseCase,
    getEnrollmentByIdUseCase,
    updateEnrollmentStatusUseCase,
    deleteEnrollmentUseCase,
  );
  const materialController = new MaterialController(
    createMaterialUseCase,
    listMaterialsUseCase,
    listMaterialsByClassUseCase,
    getMaterialUseCase,
  );
  const gradeController = new GradeController(
    createGradeUseCase,
    listGradesUseCase,
    getGradeByIdUseCase,
    listGradesByEnrollmentUseCase,
  );
  const certificateController = new CertificateController(
    generateCertificateUseCase,
    getCertificateUseCase,
  );

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

  // Health
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/users', userRoutes(userController));
  app.use('/classes', classRoutes(classController));
  app.use('/enrollments', enrollmentRoutes(enrollmentController));
  app.use('/materials', materialRoutes(materialController));
  app.use('/grades', gradeRoutes(gradeController));
  app.use('/certificates', certificateRoutes(certificateController));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
