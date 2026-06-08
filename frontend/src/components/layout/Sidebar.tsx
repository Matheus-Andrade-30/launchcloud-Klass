import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  BarChart3,
  GraduationCap,
  ShieldCheck,
  LogOut,
  BookMarked,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

type Section = 'admin' | 'professor' | 'aluno';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Usuários', path: '/admin/usuarios', icon: <Users size={18} /> },
  { label: 'Turmas', path: '/admin/turmas', icon: <BookOpen size={18} /> },
  { label: 'Matrículas', path: '/admin/matriculas', icon: <ClipboardList size={18} /> },
];

const professorNav: NavItem[] = [
  { label: 'Dashboard', path: '/professor', icon: <LayoutDashboard size={18} /> },
  { label: 'Minhas Turmas', path: '/professor/turmas', icon: <BookOpen size={18} /> },
  { label: 'Notas', path: '/professor/notas', icon: <FileText size={18} /> },
  { label: 'Provas', path: '/professor/provas', icon: <ClipboardList size={18} /> },
];

const alunoNav: NavItem[] = [
  { label: 'Dashboard', path: '/aluno', icon: <LayoutDashboard size={18} /> },
  { label: 'Minhas Turmas', path: '/aluno/turmas', icon: <BookMarked size={18} /> },
  { label: 'Provas', path: '/aluno/provas', icon: <ClipboardList size={18} /> },
  { label: 'Notas & Certificados', path: '/aluno/notas', icon: <GraduationCap size={18} /> },
];

interface SidebarProps {
  section: Section;
}

export default function Sidebar({ section }: SidebarProps) {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();

  const navItems =
    section === 'admin' ? adminNav : section === 'professor' ? professorNav : alunoNav;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Klass</span>
        </div>
      </div>

      {/* Section switcher (teacher only) */}
      {isTeacher && (
        <div className="border-b border-gray-100 p-3">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => navigate('/admin')}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                section === 'admin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              Admin
            </button>
            <button
              onClick={() => navigate('/professor')}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                section === 'professor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              Professor
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path.split('/').length === 2}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {isTeacher && section === 'admin' && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Anti-fraude</p>
            <NavLink
              to="/professor/provas"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <BarChart3 size={18} />
              Relatórios
            </NavLink>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 flex-shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
