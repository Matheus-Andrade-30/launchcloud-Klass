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
      { name: 'Provas', description: 'Criação e realização de provas' },
      { name: 'Questoes', description: 'Questões vinculadas às provas' },
      { name: 'Antifraude', description: 'Telemetria de sessão e relatório de fraude' },
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
        Prova: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titulo: { type: 'string', example: 'Prova Final de Matemática' },
            professorId: { type: 'string', example: 'u-t1' },
            dataInicio: { type: 'string', format: 'date-time' },
            dataFim: { type: 'string', format: 'date-time' },
            duracaoMinutos: { type: 'integer', example: 90 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateProva: {
          type: 'object',
          required: ['professorId', 'titulo', 'dataInicio', 'dataFim', 'duracaoMinutos'],
          properties: {
            professorId: { type: 'string', example: 'u-t1' },
            titulo: { type: 'string', example: 'Prova Final de Matemática' },
            dataInicio: { type: 'string', example: '2025-06-01T08:00:00.000Z' },
            dataFim: { type: 'string', example: '2025-06-01T10:00:00.000Z' },
            duracaoMinutos: { type: 'integer', example: 90 },
          },
        },
        Questao: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            provaId: { type: 'string' },
            enunciado: { type: 'string' },
            tipo: { type: 'string', enum: ['dissertativa', 'multipla_escolha'] },
            pontuacao: { type: 'number', example: 3.0 },
            ordem: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateQuestao: {
          type: 'object',
          required: ['provaId', 'professorId', 'enunciado', 'tipo', 'pontuacao', 'ordem'],
          properties: {
            provaId: { type: 'string', example: 'p-1' },
            professorId: { type: 'string', example: 'u-t1' },
            enunciado: { type: 'string', example: 'Calcule a derivada de f(x) = x².' },
            tipo: { type: 'string', enum: ['dissertativa', 'multipla_escolha'] },
            pontuacao: { type: 'number', example: 3.0 },
            ordem: { type: 'integer', example: 1 },
          },
        },
        ProvaComQuestoes: {
          type: 'object',
          properties: {
            prova: { $ref: '#/components/schemas/Prova' },
            questoes: { type: 'array', items: { $ref: '#/components/schemas/Questao' } },
          },
        },
        RelatorioAluno: {
          type: 'object',
          properties: {
            alunoId: { type: 'string' },
            nivelRisco: { type: 'string', enum: ['baixo', 'medio', 'alto'] },
            totalVersoesSuspeitas: { type: 'integer' },
            totalFotosComFlags: { type: 'integer' },
            totalScreenshots: { type: 'integer' },
            eventos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tipo: { type: 'string', example: 'cola_detectada' },
                  questaoId: { type: 'string' },
                  horario: { type: 'string', format: 'date-time' },
                  s3Key: { type: 'string' },
                  detalhes: { type: 'object' },
                },
              },
            },
          },
        },
        RelatorioProva: {
          type: 'object',
          properties: {
            provaId: { type: 'string' },
            titulo: { type: 'string' },
            geradoEm: { type: 'string', format: 'date-time' },
            totalAlunos: { type: 'integer' },
            alunosComAlerta: { type: 'integer' },
            alunos: { type: 'array', items: { $ref: '#/components/schemas/RelatorioAluno' } },
          },
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
      '/prova': {
        get: {
          tags: ['Provas'],
          summary: 'Retorna prova com questões para um aluno matriculado',
          parameters: [
            { name: 'prova_id', in: 'query', required: true, schema: { type: 'string' }, example: 'p-1' },
            { name: 'aluno_id', in: 'query', required: true, schema: { type: 'string' }, example: 'u-s1' },
          ],
          responses: {
            200: {
              description: 'Prova com questões',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ProvaComQuestoes' } } },
            },
            403: { description: 'Aluno não matriculado nesta prova' },
            404: { description: 'Prova não encontrada' },
            410: { description: 'Prova encerrada' },
            425: { description: 'Prova ainda não iniciou' },
          },
        },
        post: {
          tags: ['Provas'],
          summary: 'Cria uma nova prova (somente professor)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProva' } } },
          },
          responses: {
            201: {
              description: 'Prova criada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Prova' } } },
            },
            403: { description: 'Apenas professores podem criar provas' },
          },
        },
      },
      '/prova/{id}/alunos': {
        post: {
          tags: ['Provas'],
          summary: 'Matricula um aluno em uma prova',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'p-1' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['alunoId'],
                  properties: { alunoId: { type: 'string', example: 'u-s1' } },
                },
              },
            },
          },
          responses: {
            201: { description: 'Aluno matriculado', content: { 'application/json': { schema: { type: 'object', properties: { matriculado: { type: 'boolean' } } } } } },
            403: { description: 'Apenas alunos podem ser matriculados' },
            404: { description: 'Prova ou aluno não encontrado' },
          },
        },
      },
      '/prova/questoes': {
        post: {
          tags: ['Questoes'],
          summary: 'Adiciona questão a uma prova',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuestao' } } },
          },
          responses: {
            201: {
              description: 'Questão criada',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Questao' } } },
            },
          },
        },
      },
      '/prova/questoes/{id}': {
        put: {
          tags: ['Questoes'],
          summary: 'Atualiza enunciado ou pontuação de uma questão',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    professorId: { type: 'string', example: 'u-t1' },
                    enunciado: { type: 'string' },
                    pontuacao: { type: 'number' },
                    ordem: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Questão atualizada' },
            404: { description: 'Questão não encontrada' },
          },
        },
      },
      '/antifraude/respostas/versoes': {
        post: {
          tags: ['Antifraude'],
          summary: 'Salva versão da resposta — detecta cola automaticamente',
          description: 'Chamado a cada 2-3 segundos durante a prova. Detecta cola quando deltaChars > 100 em velocidade > 50 chars/s. Persiste conteúdo no S3.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['aluno_id', 'prova_id', 'questao_id', 'timestamp', 'horario', 'conteudo'],
                  properties: {
                    aluno_id: { type: 'string', example: 'u-s1' },
                    prova_id: { type: 'string', example: 'p-1' },
                    questao_id: { type: 'string', example: 'q-1' },
                    timestamp: { type: 'integer', example: 1716681600000, description: 'Unix ms' },
                    horario: { type: 'string', example: '2025-05-26T10:00:00.000Z' },
                    conteudo: { type: 'string', example: 'A derivada de f(x) = x² é f\'(x) = 2x.' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Versão salva',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      versaoNum: { type: 'integer' },
                      suspeito: { type: 'boolean', description: 'true se velocidade de digitação suspeita' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/antifraude/telemetria/photocam': {
        post: {
          tags: ['Antifraude'],
          summary: 'Salva foto da câmera e analisa rosto com AWS Rekognition',
          description: 'Chamado a cada 2-3 segundos. Detecta: sem_rosto, multiplos_rostos, identidade_suspeita (<80% similarity). Persiste imagem no S3.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['aluno_id', 'prova_id', 'questao_id', 'timestamp', 'horario', 'imagem_base64'],
                  properties: {
                    aluno_id: { type: 'string', example: 'u-s1' },
                    prova_id: { type: 'string', example: 'p-1' },
                    questao_id: { type: 'string', example: 'q-1' },
                    timestamp: { type: 'integer', example: 1716681600000 },
                    horario: { type: 'string', example: '2025-05-26T10:00:00.000Z' },
                    imagem_base64: { type: 'string', description: 'Imagem JPEG em Base64' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Foto analisada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      registrado: { type: 'boolean' },
                      flags: { type: 'array', items: { type: 'string' }, example: ['sem_rosto'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/antifraude/telemetria/screenshot': {
        post: {
          tags: ['Antifraude'],
          summary: 'Salva print da tela para análise posterior',
          description: 'Chamado a cada 2-3 segundos. Persiste PNG no S3 para revisão humana.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['aluno_id', 'prova_id', 'questao_id', 'timestamp', 'horario', 'screenshot_base64'],
                  properties: {
                    aluno_id: { type: 'string', example: 'u-s1' },
                    prova_id: { type: 'string', example: 'p-1' },
                    questao_id: { type: 'string', example: 'q-1' },
                    timestamp: { type: 'integer', example: 1716681600000 },
                    horario: { type: 'string', example: '2025-05-26T10:00:00.000Z' },
                    screenshot_base64: { type: 'string', description: 'Print da tela em Base64 (PNG)' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Screenshot salvo',
              content: { 'application/json': { schema: { type: 'object', properties: { registrado: { type: 'boolean' } } } } },
            },
          },
        },
      },
      '/antifraude/relatorio/{provaId}': {
        get: {
          tags: ['Antifraude'],
          summary: 'Relatório de fraude da prova agrupado por aluno',
          description: 'Retorna todos os eventos suspeitos (cola, rosto ausente, identidade suspeita) ordenados por nível de risco (alto → baixo).',
          parameters: [{ name: 'provaId', in: 'path', required: true, schema: { type: 'string' }, example: 'p-1' }],
          responses: {
            200: {
              description: 'Relatório gerado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/RelatorioProva' } } },
            },
            404: { description: 'Prova não encontrada' },
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
