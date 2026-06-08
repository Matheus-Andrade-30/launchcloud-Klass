import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';
import RoleRedirect from '@/components/RoleRedirect';
import MainLayout from '@/components/layout/MainLayout';

import LoginPage from '@/pages/auth/LoginPage';

import AdminDashboard from '@/pages/admin/DashboardPage';
import AdminUsersPage from '@/pages/admin/UsersPage';
import AdminClassesPage from '@/pages/admin/ClassesPage';
import AdminEnrollmentsPage from '@/pages/admin/EnrollmentsPage';

import ProfessorDashboard from '@/pages/professor/DashboardPage';
import ProfessorClassesPage from '@/pages/professor/ClassesPage';
import ProfessorClassDetail from '@/pages/professor/ClassDetailPage';
import ProfessorGrades from '@/pages/professor/GradesPage';
import ProfessorProvas from '@/pages/professor/ProvasPage';
import ProfessorRelatorio from '@/pages/professor/RelatorioPage';

import AlunoDashboard from '@/pages/aluno/DashboardPage';
import AlunoTurmas from '@/pages/aluno/TurmasPage';
import AlunoProvas from '@/pages/aluno/ProvasPage';
import AlunoProva from '@/pages/aluno/ProvaPage';
import AlunoNotas from '@/pages/aluno/NotasPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route
            path="/admin"
            element={
              <PrivateRoute roles={['teacher']}>
                <MainLayout section="admin" />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<AdminUsersPage />} />
            <Route path="turmas" element={<AdminClassesPage />} />
            <Route path="matriculas" element={<AdminEnrollmentsPage />} />
          </Route>

          <Route
            path="/professor"
            element={
              <PrivateRoute roles={['teacher']}>
                <MainLayout section="professor" />
              </PrivateRoute>
            }
          >
            <Route index element={<ProfessorDashboard />} />
            <Route path="turmas" element={<ProfessorClassesPage />} />
            <Route path="turmas/:id" element={<ProfessorClassDetail />} />
            <Route path="notas" element={<ProfessorGrades />} />
            <Route path="provas" element={<ProfessorProvas />} />
            <Route path="provas/:id/relatorio" element={<ProfessorRelatorio />} />
          </Route>

          <Route
            path="/aluno"
            element={
              <PrivateRoute roles={['student']}>
                <MainLayout section="aluno" />
              </PrivateRoute>
            }
          >
            <Route index element={<AlunoDashboard />} />
            <Route path="turmas" element={<AlunoTurmas />} />
            <Route path="provas" element={<AlunoProvas />} />
            <Route path="prova/:id" element={<AlunoProva />} />
            <Route path="notas" element={<AlunoNotas />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
