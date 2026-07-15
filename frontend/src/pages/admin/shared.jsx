import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FiLayers, FiFileText, FiGrid, FiBarChart2, FiSettings,
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiTrendingUp,
  FiUsers, FiDollarSign, FiAward, FiBook,
} from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { enrollmentService, adminService, blogService } from '../../services';
import { EmptyState, Spinner, Modal, ConfirmDialog, Pagination, StatCard } from '../../components/ui/index.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

/* ══════════════════════════════════════════════════════════════════
   ADMIN ENROLLMENTS
══════════════════════════════════════════════════════════════════ */
export const AdminEnrollments = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [reportTarget, setReportTarget] = useState(null);

  const { data, isLoading } = useQuery(
    ['admin-enrollments', page, type, status],
    () => enrollmentService.getAll({ page, limit: 15, type: type || undefined, status: status || undefined }),
    { keepPreviousData: true }
  );
  const enrollments = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Enrollments</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} total enrollments</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
          <option value="">All Types</option>
          <option value="course">Course</option>
          <option value="internship">Internship</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
          <option value="">All Status</option>
          {['active', 'completed', 'suspended', 'expired', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : enrollments.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['Student', 'Item', 'Type', 'Progress', 'Status', 'Reports', 'Enrolled', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {enrollments.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{e.student?.firstName} {e.student?.lastName}</p>
                        <p className="text-xs text-gray-400">{e.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[160px]">
                        <span className="line-clamp-1">{e.course?.title || e.internship?.title || '—'}</span>
                      </td>
                      <td className="px-4 py-3"><span className="badge-primary text-xs capitalize">{e.type}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-dark-300 rounded-full h-1.5 min-w-[60px]">
                            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${e.progress || 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{e.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${e.status === 'completed' ? 'badge-success' : e.status === 'active' ? 'badge-info' : 'badge-warning'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {e.weeklyReports?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(e.enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {e.status === 'active' && e.type === 'internship' && !e.certificateIssued && (
                            <button
                              onClick={async () => {
                                try {
                                  await enrollmentService.complete(e._id);
                                  toast.success('Marked complete — certificate issued!');
                                  queryClient.invalidateQueries(['admin-enrollments']);
                                } catch {}
                              }}
                              className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                            >
                              Complete
                            </button>
                          )}
                          {e.weeklyReports?.length > 0 && (
                            <button
                              onClick={() => setReportTarget(e)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            >
                              View report{e.weeklyReports.length > 1 ? 's' : ''}
                            </button>
                          )}
                          {e.certificateIssued && <span className="text-xs text-green-500 font-medium">✓ Cert issued</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />

          <Modal
            isOpen={!!reportTarget}
            onClose={() => setReportTarget(null)}
            title={`Weekly Reports — ${reportTarget?.course?.title || reportTarget?.internship?.title || 'Enrollment'}`}
            size="lg"
          >
            <div className="space-y-4">
              {reportTarget?.weeklyReports?.length > 0 ? (
                reportTarget.weeklyReports.map((report, index) => (
                  <div key={index} className="border border-gray-200 dark:border-dark-300 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Week {report.week}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Submitted {new Date(report.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      {report.rating != null && (
                        <span className="badge text-xs badge-primary">Rating {report.rating}/5</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{report.report}</p>
                    {report.mentorFeedback && (
                      <div className="mt-3 rounded-lg bg-gray-50 dark:bg-dark-300 p-3 text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-medium text-gray-900 dark:text-white">Mentor feedback</p>
                        <p>{report.mentorFeedback}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No weekly reports have been submitted for this enrollment yet.</p>
              )}
            </div>
          </Modal>
        </>
      ) : (
        <EmptyState icon={FiLayers} title="No enrollments found" description="Enrollments will appear here as students sign up" />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN BLOGS
══════════════════════════════════════════════════════════════════ */
export const AdminBlogs = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery(['admin-blogs', page], () => blogService.getAllForAdmin({ page, limit: 12 }), { keepPreviousData: true });
  const blogs = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await blogService.delete(deleteTarget._id);
      toast.success('Blog deleted');
      queryClient.invalidateQueries(['admin-blogs']);
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Blog Posts</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} posts</p>
        </div>
        <Link to="/admin/blogs/new" className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> New Post
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : blogs.length > 0 ? (
        <>
          <div className="space-y-3">
            {blogs.map(blog => (
              <div key={blog._id} className="card p-4 flex items-center gap-4">
                {blog.thumbnail && (
                  <img src={blog.thumbnail} alt="" className="w-16 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{blog.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {blog.author?.firstName} {blog.author?.lastName} •
                    {new Date(blog.createdAt).toLocaleDateString('en-IN')} •
                    {blog.readingTime} min read
                  </p>
                </div>
                <span className={`badge text-xs ${blog.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{blog.status}</span>
                <Link to={`/blog/${blog.slug}`} target="_blank" className="btn-secondary text-xs py-1.5 px-3">View</Link>
                <Link to={`/admin/blogs/${blog._id}/edit`} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-all">
                  <FiEdit2 size={14} />
                </Link>
                <button onClick={() => setDeleteTarget(blog)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={FiFileText} title="No blog posts" description="Create your first blog post to engage students"
          action={<Link to="/admin/blogs/new" className="btn-primary">New Post</Link>} />
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Post" message={`Delete "${deleteTarget?.title}"?`} confirmText="Delete" danger loading={deleting} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN CATEGORIES
══════════════════════════════════════════════════════════════════ */
export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery('admin-categories-mgmt', adminService.getCategories);
  const cats = data?.data?.data || [];

  const openCreate = () => { setEditTarget(null); reset({ name: '', description: '', type: 'general', isActive: true }); setFormOpen(true); };
  const openEdit = (c) => { setEditTarget(c); reset({ name: c.name, description: c.description, type: c.type, isActive: c.isActive }); setFormOpen(true); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editTarget) { await adminService.updateCategory(editTarget._id, data); toast.success('Category updated'); }
      else { await adminService.createCategory(data); toast.success('Category created'); }
      queryClient.invalidateQueries('admin-categories-mgmt');
      setFormOpen(false);
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminService.deleteCategory(deleteTarget._id);
      toast.success('Deleted');
      queryClient.invalidateQueries('admin-categories-mgmt');
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><FiPlus size={16} /> Add Category</button>
      </div>
      {isLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                {['Name', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
              {cats.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3"><span className="badge-primary text-xs capitalize">{c.type}</span></td>
                  <td className="px-4 py-3"><span className={`badge text-xs ${c.isActive ? 'badge-success' : 'badge-warning'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 text-blue-500 transition-all"><FiEdit2 size={14} /></button>
                    <button onClick={() => setDeleteTarget(c)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"><FiTrash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">No categories yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label><input {...register('name', { required: true })} className="input" placeholder="e.g. Web Development" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label><input {...register('description')} className="input" placeholder="Optional" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label><select {...register('type')} className="input">{['course', 'blog', 'internship', 'general'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input {...register('isActive')} type="checkbox" defaultChecked className="w-4 h-4 accent-primary-500" /> Active</label>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? <Spinner size="sm" /> : null}{editTarget ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Category" message={`Delete "${deleteTarget?.name}"?`} confirmText="Delete" danger loading={deleting} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN ANALYTICS
══════════════════════════════════════════════════════════════════ */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const AdminAnalytics = () => {
  const { data: overview } = useQuery('analytics-overview', adminService.getOverview);
  const { data: revenueData } = useQuery('analytics-revenue', () => adminService.getRevenue({ period: 12 }));
  const { data: userData } = useQuery('analytics-users', adminService.getUserAnalytics);

  const ov = overview?.data?.data || {};
  const monthly = revenueData?.data?.data?.monthly || [];
  const topCourses = revenueData?.data?.data?.topCourses || [];
  const growth = userData?.data?.data?.growth || [];

  const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(128,128,128,0.1)' } } } };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Students', value: ov.users?.total?.toLocaleString() || '0', icon: FiUsers, color: 'primary' },
          { title: 'Total Revenue', value: `₹${(ov.revenue?.total || 0).toLocaleString('en-IN')}`, icon: FiDollarSign, color: 'green' },
          { title: 'Certificates', value: ov.certificates?.total?.toLocaleString() || '0', icon: FiAward, color: 'orange' },
          { title: 'Active Courses', value: ov.courses?.published || '0', icon: FiBook, color: 'blue' },
        ].map(s => <StatCard key={s.title} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Monthly Revenue (₹)</h2>
          {monthly.length > 0 ? (
            <Line data={{ labels: monthly.map(m => `${MONTHS[m._id.month - 1]} '${String(m._id.year).slice(-2)}`), datasets: [{ label: 'Revenue', data: monthly.map(m => m.revenue), borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.1)', fill: true, tension: 0.4 }] }} options={chartOpts} />
          ) : <p className="text-center text-gray-400 py-10 text-sm">No revenue data yet</p>}
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Student Growth</h2>
          {growth.length > 0 ? (
            <Bar data={{ labels: growth.map(g => `${MONTHS[g._id.month - 1]} '${String(g._id.year).slice(-2)}`), datasets: [{ label: 'New Students', data: growth.map(g => g.count), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 }] }} options={chartOpts} />
          ) : <p className="text-center text-gray-400 py-10 text-sm">No growth data yet</p>}
        </div>
      </div>

      {topCourses.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Top Revenue Courses</h2>
          <div className="space-y-3">
            {topCourses.map((c, i) => (
              <div key={c._id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{c.title}</span>
                <span className="text-sm font-bold text-green-600">₹{c.revenue?.toLocaleString('en-IN')}</span>
                <span className="text-xs text-gray-500">{c.count} enrolled</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN SETTINGS
══════════════════════════════════════════════════════════════════ */
export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data, isLoading } = useQuery('admin-settings', adminService.getSettings);
  const settings = data?.data?.data || [];

  const [editValues, setEditValues] = useState({});

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await adminService.updateSetting({ key, value, type: 'string', isPublic: false });
      toast.success(`Setting "${key}" saved`);
      queryClient.invalidateQueries('admin-settings');
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Site Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Platform-wide configuration key-value pairs</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card p-6 space-y-4">
          {settings.length > 0 ? settings.map(s => (
            <div key={s._id} className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.key}</p>
                {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  defaultValue={typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}
                  onChange={e => setEditValues(p => ({ ...p, [s.key]: e.target.value }))}
                  className="input py-2 text-sm flex-1"
                />
                <button onClick={() => handleSave(s.key, editValues[s.key] ?? s.value)} disabled={saving}
                  className="btn-primary text-xs px-3 py-2">Save</button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-400 text-center py-6">No settings configured yet. Settings are added programmatically via the API.</p>
          )}
        </div>
      )}

      {/* Add new setting */}
      <div className="card p-6 space-y-3">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm">Add New Setting</h2>
        <AddSettingForm onSaved={() => queryClient.invalidateQueries('admin-settings')} />
      </div>
    </div>
  );
};

const AddSettingForm = ({ onSaved }) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const handleAdd = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await adminService.updateSetting({ key: key.trim(), value: value.trim(), type: 'string' });
      toast.success('Setting added');
      setKey(''); setValue('');
      onSaved();
    } catch {} finally { setSaving(false); }
  };
  return (
    <div className="flex gap-2">
      <input value={key} onChange={e => setKey(e.target.value)} placeholder="Setting key" className="input flex-1 py-2 text-sm" />
      <input value={value} onChange={e => setValue(e.target.value)} placeholder="Value" className="input flex-1 py-2 text-sm" />
      <button onClick={handleAdd} disabled={saving || !key.trim()} className="btn-primary text-sm px-4 flex items-center gap-1.5">
        {saving ? <Spinner size="sm" /> : <FiPlus size={14} />} Add
      </button>
    </div>
  );
};

// Default export fallback — router imports these as individual default exports via their own files
export default AdminEnrollments;
