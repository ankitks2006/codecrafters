import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiBook } from 'react-icons/fi';
import { courseService } from '../../services';
import { Pagination, EmptyState, ConfirmDialog, Spinner } from '../../components/ui/index.jsx';

const AdminCourses = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery(
    ['admin-courses', page, search],
    () => courseService.getAll({ page, limit: 12, search: search || undefined }),
    { keepPreviousData: true }
  );

  const courses = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await courseService.delete(deleteTarget._id);
      toast.success('Course deleted');
      queryClient.invalidateQueries(['admin-courses']);
      setDeleteTarget(null);
    } catch {
      // error toast handled by api interceptor
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Manage Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} courses total</p>
        </div>
        <Link to="/admin/courses/new" className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> Add Course
        </Link>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search courses..."
          className="input pl-10 py-2.5 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : courses.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['Course', 'Category', 'Price', 'Students', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {courses.map(course => (
                    <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={course.thumbnail || 'https://placehold.co/60x40/6C63FF/white?text=C'}
                            alt="" className="w-12 h-8 rounded-lg object-cover flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-xs">{course.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{course.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {course.price === 0 ? 'Free' : `₹${course.price?.toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{course.enrollmentCount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/courses/${course.slug}`} target="_blank"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 text-gray-500 transition-all" title="Preview">
                            <FiEye size={14} />
                          </Link>
                          <Link to={`/admin/courses/${course._id}/edit`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 text-blue-500 transition-all" title="Edit">
                            <FiEdit2 size={14} />
                          </Link>
                          <button onClick={() => setDeleteTarget(course)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all" title="Delete">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={FiBook} title="No courses yet" description="Create your first course to get started"
          action={<Link to="/admin/courses/new" className="btn-primary">Add Course</Link>} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone. Courses with active enrollments cannot be deleted.`}
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default AdminCourses;
