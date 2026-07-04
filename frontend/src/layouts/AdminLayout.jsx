import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { closeMobileSidebar } from '../redux/slices/uiSlice';
import AdminSidebar from '../components/common/AdminSidebar';
import DashboardHeader from '../components/common/DashboardHeader';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, mobileSidebarOpen } = useSelector(state => state.ui);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) dispatch(closeMobileSidebar());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => dispatch(closeMobileSidebar())} />
      )}
      <AdminSidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <DashboardHeader isAdmin />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
