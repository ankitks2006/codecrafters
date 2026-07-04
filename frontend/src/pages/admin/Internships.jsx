import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiBriefcase, FiEye } from 'react-icons/fi';
import { internshipService } from '../../services';
import { Modal, ConfirmDialog, EmptyState, Spinner, Pagination } from '../../components/ui/index.jsx';

const STATUSES = ['upcoming', 'active', 'completed', 'archived'];
const TYPES = ['remote', 'hybrid', 'onsite'];

const AdminInternships = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery(
    ['admin-internships', page],
    () => internshipService.getAll({ page, limit: 10 }),
    { keepPreviousData: true }
  );
  const internships = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const openCreate = () => {
    setEditTarget(null);
    reset({
      title: '', shortDescription: '', description: '', duration: 4,
      type: 'remote', isPaid: false, price: 0, status: 'upcoming',
      hasCertificate: true, hasLetterOfRecommendation: true, isPublished: false,
      maxStudents: 50,
    });
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    reset({
      title: item.title, shortDescription: item.shortDescription, description: item.description,
      duration: item.duration, type: item.type, isPaid: item.isPaid, price: item.price,
      status: item.status, hasCertificate: item.hasCertificate,
      hasLetterOfRecommendation: item.hasLetterOfRecommendation,
      isPublished: item.isPublished, maxStudents: item.maxStudents,
    });
    setFormOpen(true);
  };

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        price: Number(formData.price) || 0,
        maxStudents: Number(formData.maxStudents) || 50,
        requirements: [],
        responsibilities: [],
      };
      if (editTarget) {
        await internshipService.update(editTarget._id, payload);
        toast.success('Internship updated');
      } else {
        await internshipService.create(payload);
        toast.success('Internship created');
      }
      queryClient.invalidateQueries(['admin-internships']);
      setFormOpen(false);
    } catch {
      // error toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await internshipService.delete(deleteTarget._id);
      toast.success('Internship deleted');
      queryClient.invalidateQueries(['admin-internships']);
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Manage Internships</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} programs total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> Add Internship
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : internships.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['Title', 'Type', 'Duration', 'Students', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {internships.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs">
                        <span className="line-clamp-1">{item.title}</span>
                        {!item.isPublished && <span className="badge-warning text-xs ml-2">Draft</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{item.type}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.duration} weeks</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.enrollmentCount || 0} / {item.maxStudents}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${
                          item.status === 'active' ? 'badge-success' :
                          item.status === 'upcoming' ? 'badge-info' :
                          item.status === 'completed' ? 'badge-primary' : 'badge-warning'
                        }`}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {item.slug && (
                            <Link to={`/internships/${item.slug}`} target="_blank"
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 text-gray-500 transition-all" title="Preview">
                              <FiEye size={14} />
                            </Link>
                          )}
                          <button onClick={() => openEdit(item)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 text-blue-500 transition-all" title="Edit">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(item)}
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
        <EmptyState icon={FiBriefcase} title="No internships yet" description="Create your first internship program"
          action={<button onClick={openCreate} className="btn-primary">Add Internship</button>} />
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? 'Edit Internship' : 'Add Internship'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input {...register('title', { required: 'Required' })} className="input" placeholder="e.g. Full Stack Development Internship" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Short Description</label>
            <input {...register('shortDescription', { required: 'Required' })} className="input" placeholder="One-line summary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Description</label>
            <textarea {...register('description', { required: 'Required' })} rows={4} className="input resize-none" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (weeks)</label>
              <input {...register('duration', { required: true, min: 1 })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
              <select {...register('type')} className="input">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹, 0 = free)</label>
              <input {...register('price', { min: 0 })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Students</label>
              <input {...register('maxStudents', { min: 1 })} type="number" className="input" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input {...register('isPaid')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" /> Paid Internship
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input {...register('hasCertificate')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" /> Certificate
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input {...register('hasLetterOfRecommendation')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" /> LOR
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input {...register('isPublished')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" /> Published
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : null} {editTarget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Internship"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default AdminInternships;
