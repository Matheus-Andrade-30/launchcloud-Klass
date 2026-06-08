import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

type Section = 'admin' | 'professor' | 'aluno';

interface MainLayoutProps {
  section: Section;
}

export default function MainLayout({ section }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar section={section} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
