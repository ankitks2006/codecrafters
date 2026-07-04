import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { toggleMobileSidebar, closeMobileSidebar } from '../redux/slices/uiSlice';
import StudentSidebar from '../components/common/StudentSidebar';
import DashboardHeader from '../components/common/DashboardHeader';

const StudentLayout = () => {
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
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      {/* Sidebar */}
      <StudentSidebar />

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
