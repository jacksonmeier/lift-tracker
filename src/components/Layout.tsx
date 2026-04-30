import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-dvh">
      <Outlet />
    </div>
  );
}
