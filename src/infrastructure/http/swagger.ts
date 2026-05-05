import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Klass API',
      version: '1.0.0',
      description:
        'Backend de plataforma EdTech para gestão de aulas, alunos, materiais e certificados. Projeto LaunchCloud — IBMEC Cloud Computing 2026.',
      contact: { name: 'Klass Team' },
    },
    servers: [
      { url: '/api', description: 'API Gateway' },
      { url: '/', description: 'Direct' },
    ],
    tags: [
      { name: 'Health', description: 'Status da aplicação' },
      { name: 'Users', description: 'Gestão de professores e alunos' },
      { name: 'Classes', description: 'Gestão de turmas' },
      { name: 'Enrollments', description: 'Matrículas de alunos nas turmas' },
      { name: 'Materials', description: 'Materiais didáticos armazenados no Amazon S3' },
      { name: 'Grades', description: 'Notas e frequência dos alunos' },
      { name: 'Certificates', description: 'Certificados gerados via AWS Lambda' },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-v4' },
            name: { type: 'string', example: 'Carlos Mendes' },
            email: { type: 'string', example: 'carlos@klass.edu' },
            role: { type: 'string', enum: ['teacher', 'student'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUser: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            name: { type: 'string', example: 'Carlos Mendes' },
            email: { type: 'string', example: 'carlos@klass.edu' },
            role: { type: 'string', enum: ['teacher', 'student'] },
          },
        },
        UpdateUser: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Carlos Mendes' },
            email: { type: 'string', example: 'carlos@klass.edu' },
            role: { type: 'string', enum: ['teacher', 'student'] },
          },
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'Matemática Avançada' },
            description: { type: 'string', example: 'Cálculo diferencial e integral' },
            teacherId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateClass: {
          type: 'object',
          required: ['title', 'description', 'teacherId'],
          properties: {
            title: { type: 'string', example: 'Matemática Avançada' },
            description: { type: 'string', example: 'Cálculo diferencial e integral' },
            teacherId: { type: 'string', example: 'u-t1' },
          },
        },
        UpdateClass: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Novo Título' },
            description: { type: 'string', example: 'Nova descrição' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            studentId: { type: 'string' },
            classId: { type: 'string' },
            status: { type: 'string', enum: ['active', 'completed', 'dropped'] },
            enrolledAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateEnrollment: {
          type: 'object',
          required: ['studentId', 'classId'],
          properties: {
            studentId: { type: 'string', example: 'u-s1' },
            classId: { type: 'string', example: 'c-1' },
          },
        },
        UpdateEnrollmentStatus: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['active', 'completed', 'dropped'] },
          },
        },
        Material: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            classId: { type: 'string' },
            uploadedBy: { type: 'string' },
            s3Key: { type: 'string' },
            contentType: { type: 'string' },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },
        MaterialWithUrl: {
          allOf: [
            { $ref: '#/components/schemas/Material' },
            {
              type: 'object',
              properties: {
                downloadUrl: { type: 'string', description: 'Presigned S3 URL (válida por 1h)' },
              },
            },
          ],
        },
        Grade: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            enrollmentId: { type: 'string' },
            teacherId: { type: 'string' },
            grade: { type: 'number', minimum: 0, maximum: 10 },
            attendance: { type: 'number', minimum: 0, maximum: 100 },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateGrade: {
          type: 'object',
          required: ['enrollmentId', 'teacherId', 'grade', 'attendance'],
          properties: {
            enrollmentId: { type: 'string' },
            teacherId: { type: 'string' },
            grade: { type: 'number', minimum: 0, maximum: 10, example: 8.5 },
            attendance: { type: 'number', minimum: 0, maximum: 100, example: 85 },
            notes: { type: 'string', example: 'Bom desempenho' },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            enrollmentId: { type: 'string' },
            s3Key: { type: 'string' },
            downloadUrl: { type: 'string', description: 'Presigned S3 URL (válida por 1h)' },
            issuedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Verifica status da aplicação',
          responses: {
            200: {
              description: 'Aplicação online',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'OK' },
                      timestamp: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Lista todos os usuários',
          responses: {
            200: {
              description: 'Lista de usuários',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Cria um novo usuário',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateUser' } },
            },
          },
          responses: {
            201: {
              description: 'Usuário criado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
            400: {
              description: 'Dados inválidos ou e-mail já cadastrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Busca usuário por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Usuário encontrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
            404: {
              description: 'Usuário não encontrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Atualiza dados do usuário',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateUser' } },
            },
          },
          responses: {
            200: {
              description: 'Usuário atualizado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
            404: {
              description: 'Usuário não encontrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Remove um usuário',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Usuário removido' },
            404: {
              description: 'Usuário não encontrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/classes': {
        get: {
          tags: ['Classes'],
          summary: 'Lista todas as turmas',
          responses: {
            200: {
              description: 'Lista de turmas',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Class' } },
                },
              },
            },
          },
        },
        post: {
          tags: ['Classes'],
          summary: 'Cria uma nova turma',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateClass' } },
            },
          },
          responses: {
            201: {
              description: 'Turma criada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Class' } } },
            },
            400: {
              description: 'Dados inválidos',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/classes/{id}': {
        get: {
          tags: ['Classes'],
          summary: 'Busca turma por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Turma encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Class' } } },
            },
            404: {
              description: 'Turma não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
        put: {
          tags: ['Classes'],
          summary: 'Atualiza dados da turma',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateClass' } },
            },
          },
          responses: {
            200: {
              description: 'Turma atualizada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Class' } } },
            },
            404: {
              description: 'Turma não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
        delete: {
          tags: ['Classes'],
          summary: 'Remove uma turma',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Turma removida' },
            404: {
              description: 'Turma não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/enrollments': {
        get: {
          tags: ['Enrollments'],
          summary: 'Lista todas as matrículas',
          responses: {
            200: {
              description: 'Lista de matrículas',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Enrollment' } },
                },
              },
            },
          },
        },
        post: {
          tags: ['Enrollments'],
          summary: 'Matricula um aluno em uma turma',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateEnrollment' } },
            },
          },
          responses: {
            201: {
              description: 'Matrícula criada',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Enrollment' } },
              },
            },
            400: {
              description: 'Dados inválidos',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/enrollments/{id}': {
        get: {
          tags: ['Enrollments'],
          summary: 'Busca matrícula por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Matrícula encontrada',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Enrollment' } },
              },
            },
            404: {
              description: 'Matrícula não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
        delete: {
          tags: ['Enrollments'],
          summary: 'Remove uma matrícula',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Matrícula removida' },
            404: {
              description: 'Matrícula não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/enrollments/{id}/status': {
        patch: {
          tags: ['Enrollments'],
          summary: 'Atualiza status da matrícula',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateEnrollmentStatus' },
              },
            },
          },
          responses: {
            200: {
              description: 'Status atualizado',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Enrollment' } },
              },
            },
            404: {
              description: 'Matrícula não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/materials': {
        get: {
          tags: ['Materials'],
          summary: 'Lista todos os materiais',
          responses: {
            200: {
              description: 'Lista de materiais',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Material' } },
                },
              },
            },
          },
        },
        post: {
          tags: ['Materials'],
          summary: 'Faz upload de material didático para o Amazon S3',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'title', 'classId', 'uploadedBy'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    classId: { type: 'string' },
                    uploadedBy: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Material enviado ao S3',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Material' } },
              },
            },
            400: {
              description: 'Dados inválidos',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/materials/{id}': {
        get: {
          tags: ['Materials'],
          summary: 'Obtém material com URL de download temporária (presigned URL)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Material com URL de download (válida por 1h)',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/MaterialWithUrl' } },
              },
            },
            404: {
              description: 'Material não encontrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/materials/class/{classId}': {
        get: {
          tags: ['Materials'],
          summary: 'Lista materiais de uma turma',
          parameters: [{ name: 'classId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Lista de materiais da turma',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Material' } },
                },
              },
            },
            404: {
              description: 'Turma não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/grades': {
        get: {
          tags: ['Grades'],
          summary: 'Lista todas as notas',
          responses: {
            200: {
              description: 'Lista de notas',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Grade' } },
                },
              },
            },
          },
        },
        post: {
          tags: ['Grades'],
          summary: 'Registra nota e frequência de um aluno (somente professor)',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateGrade' } },
            },
          },
          responses: {
            201: {
              description: 'Nota registrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Grade' } } },
            },
            400: {
              description: 'Dados inválidos',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/grades/{id}': {
        get: {
          tags: ['Grades'],
          summary: 'Busca nota por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Nota encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Grade' } } },
            },
            404: {
              description: 'Nota não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/grades/enrollment/{enrollmentId}': {
        get: {
          tags: ['Grades'],
          summary: 'Lista notas de uma matrícula',
          parameters: [
            { name: 'enrollmentId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Lista de notas',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Grade' } },
                },
              },
            },
            404: {
              description: 'Matrícula não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/certificates/{id}': {
        get: {
          tags: ['Certificates'],
          summary: 'Obtém certificado com URL de download temporária',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Certificado com URL de download (válida por 1h)',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Certificate' } },
              },
            },
            404: {
              description: 'Certificado não encontrado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/certificates/enrollment/{enrollmentId}': {
        post: {
          tags: ['Certificates'],
          summary: 'Gera certificado para matrícula concluída via AWS Lambda',
          description:
            'Invoca uma função AWS Lambda que gera o PDF do certificado e armazena no S3. A matrícula deve estar com status "completed".',
          parameters: [
            { name: 'enrollmentId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            201: {
              description: 'Certificado gerado e armazenado no S3',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Certificate' } },
              },
            },
            400: {
              description: 'Matrícula não concluída',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            404: {
              description: 'Matrícula não encontrada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
