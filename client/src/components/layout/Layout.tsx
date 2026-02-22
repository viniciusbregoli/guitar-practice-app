import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-void noise-bg" style={{ minHeight: '100dvh' }}>
      <Navigation />
      <main className="flex-1 min-w-0 pb-20" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </main>
    </div>
  );
}
