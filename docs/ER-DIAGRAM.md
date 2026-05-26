# Diagrama Entidade-Relacionamento — Klass EdTech Platform

**Banco de dados:** MySQL 8.0 | **Instância:** Amazon RDS db.t3.micro | **Total:** 12 tabelas

---

## Diagrama (Mermaid)

```mermaid
erDiagram
    users {
        VARCHAR(36) id PK
        VARCHAR(255) name
        VARCHAR(255) email UK
        ENUM role "teacher | student"
        DATETIME created_at
    }

    classes {
        VARCHAR(36) id PK
        VARCHAR(255) title
        TEXT description
        VARCHAR(36) teacher_id FK
        DATETIME created_at
    }

    enrollments {
        VARCHAR(36) id PK
        VARCHAR(36) student_id FK
        VARCHAR(36) class_id FK
        ENUM status "active | completed | dropped"
        DATETIME enrolled_at
    }

    materials {
        VARCHAR(36) id PK
        VARCHAR(255) title
        TEXT description
        VARCHAR(36) class_id FK
        VARCHAR(36) uploaded_by FK
        VARCHAR(1024) s3_key
        VARCHAR(255) content_type
        DATETIME uploaded_at
    }

    grades {
        VARCHAR(36) id PK
        VARCHAR(36) enrollment_id FK
        VARCHAR(36) teacher_id FK
        DECIMAL(4_2) grade
        DECIMAL(5_2) attendance
        TEXT notes
        DATETIME created_at
    }

    certificates {
        VARCHAR(36) id PK
        VARCHAR(36) enrollment_id FK UK
        VARCHAR(1024) s3_key
        DATETIME issued_at
    }

    provas {
        VARCHAR(36) id PK
        VARCHAR(255) titulo
        VARCHAR(36) professor_id FK
        DATETIME data_inicio
        DATETIME data_fim
        INT duracao_minutos
        DATETIME created_at
    }

    questoes {
        VARCHAR(36) id PK
        VARCHAR(36) prova_id FK
        TEXT enunciado
        ENUM tipo "dissertativa | multipla_escolha"
        DECIMAL(5_2) pontuacao
        INT ordem
        DATETIME created_at
    }

    provas_alunos {
        VARCHAR(36) id PK
        VARCHAR(36) prova_id FK
        VARCHAR(36) aluno_id FK
    }

    respostas_versoes {
        VARCHAR(36) id PK
        VARCHAR(36) aluno_id FK
        VARCHAR(36) prova_id FK
        VARCHAR(36) questao_id FK
        INT versao_num
        VARCHAR(1024) s3_key
        INT char_count
        INT line_count
        INT delta_chars
        BOOLEAN suspeito
        BIGINT timestamp
        DATETIME horario
    }

    telemetria_photocam {
        VARCHAR(36) id PK
        VARCHAR(36) aluno_id FK
        VARCHAR(36) prova_id FK
        VARCHAR(36) questao_id FK
        VARCHAR(1024) s3_key
        INT faces_detectadas
        DECIMAL(5_2) similarity_score
        JSON flags
        BIGINT timestamp
        DATETIME horario
    }

    telemetria_screenshot {
        VARCHAR(36) id PK
        VARCHAR(36) aluno_id FK
        VARCHAR(36) prova_id FK
        VARCHAR(36) questao_id FK
        VARCHAR(1024) s3_key
        BIGINT timestamp
        DATETIME horario
    }

    %% Módulo de Gestão de Aulas
    users ||--o{ classes : "ministra (teacher_id)"
    users ||--o{ enrollments : "matricula (student_id)"
    classes ||--o{ enrollments : "pertence (class_id)"
    enrollments ||--o{ grades : "recebe (enrollment_id)"
    enrollments ||--o| certificates : "gera (enrollment_id)"
    classes ||--o{ materials : "contém (class_id)"
    users ||--o{ materials : "envia (uploaded_by)"
    users ||--o{ grades : "lança (teacher_id)"

    %% Módulo Antifraude
    users ||--o{ provas : "cria (professor_id)"
    provas ||--o{ questoes : "tem (prova_id)"
    provas ||--o{ provas_alunos : "matricula (prova_id)"
    users ||--o{ provas_alunos : "participa (aluno_id)"
    users ||--o{ respostas_versoes : "envia (aluno_id)"
    provas ||--o{ respostas_versoes : "recebe (prova_id)"
    questoes ||--o{ respostas_versoes : "refere (questao_id)"
    users ||--o{ telemetria_photocam : "gera (aluno_id)"
    provas ||--o{ telemetria_photocam : "captura (prova_id)"
    questoes ||--o{ telemetria_photocam : "durante (questao_id)"
    users ||--o{ telemetria_screenshot : "gera (aluno_id)"
    provas ||--o{ telemetria_screenshot : "captura (prova_id)"
    questoes ||--o{ telemetria_screenshot : "durante (questao_id)"
```

---

## Descrição dos Módulos

### Módulo 1 — Gestão de Aulas (6 tabelas)

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema (professores e alunos) |
| `classes` | Turmas criadas por professores |
| `enrollments` | Matrículas de alunos em turmas (com status) |
| `materials` | Materiais didáticos com link para S3 |
| `grades` | Notas e frequência por matrícula |
| `certificates` | Certificados gerados automaticamente para turmas concluídas |

### Módulo 2 — Antifraude (6 tabelas)

| Tabela | Descrição |
|---|---|
| `provas` | Provas criadas por professores com janela de tempo |
| `questoes` | Questões de cada prova (dissertativa ou múltipla escolha) |
| `provas_alunos` | Relação M:N entre provas e alunos autorizados |
| `respostas_versoes` | Versionamento incremental de respostas (detecta colagem) |
| `telemetria_photocam` | Capturas de câmera com análise facial (AWS Rekognition) |
| `telemetria_screenshot` | Screenshots periódicos da tela durante a prova |

---

## Relacionamentos-chave

```
users (1) ──── (N) classes          [professor ministra turmas]
users (1) ──── (N) enrollments      [aluno se matricula em turmas]
classes (1) ── (N) enrollments      [turma tem muitos alunos]
enrollments (1) ── (1) certificates [matrícula concluída gera certificado]
enrollments (1) ── (N) grades       [matrícula tem notas ao longo do tempo]

users (1) ──── (N) provas           [professor cria provas]
provas (1) ─── (N) questoes         [prova tem questões ordenadas]
provas (M) ─── (N) users            [via provas_alunos — alunos autorizados]
respostas_versoes (N) → users + provas + questoes   [telemetria de escrita]
telemetria_photocam (N) → users + provas + questoes [capturas de câmera]
telemetria_screenshot (N) → users + provas + questoes [capturas de tela]
```

---

## Armazenamento no S3 (`klass-materials-278746617329`)

| Prefixo S3 | Conteúdo | Tabela relacionada |
|---|---|---|
| `materials/` | PDFs, vídeos, slides | `materials.s3_key` |
| `certificates/` | PDFs gerados | `certificates.s3_key` |
| `antifraude/respostas/` | Versões de texto das respostas | `respostas_versoes.s3_key` |
| `antifraude/photocam/` | Imagens da câmera do aluno | `telemetria_photocam.s3_key` |
| `antifraude/screenshots/` | Screenshots da tela | `telemetria_screenshot.s3_key` |
