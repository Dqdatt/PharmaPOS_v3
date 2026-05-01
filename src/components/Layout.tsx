import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col ml-64 min-w-0">
        <Header />
        <div className="mt-16 p-8 flex-1 overflow-y-auto bg-surface custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
