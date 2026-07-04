import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiCheckSquare, FiEye, FiTrash2, FiUsers } from 'react-icons/fi';
import { assignmentService, courseService } from '../../services';
import { Modal, EmptyState, Spinner, ConfirmDialog } from '../../components/ui/index.jsx';

const AdminAssignments = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submissionsTarget, setSubmissionsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reuse the public course list to populate the course dropdown when creating an assignment
  const { data: coursesData } = useQuery('admin-assignment-courses', () => courseService.getAll({ limit: 50 }));
  const courses = coursesData?.data?.data || [];

  // List assignments created by this admin/trainer
  const { data: myAssignments, isLoading } = useQuery('admin-created-assignments', () => assignmentService.getCreatedByMe());
  const assignments = myAssignments?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { maxMarks: 100, passingMarks: 40, allowLateSubmission: false },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await assignmentService.create({
        title: data.title,
        description: data.description,
        course: data.course,
        deadline: data.deadline,
        maxMarks: Number(data.maxMarks),
        passingMarks: Number(data.passingMarks),
        allowLateSubmission: data.allowLateSubmission,
      });
      toast.success('Assignment created');
      queryClient.invalidateQueries('admin-created-assignments');
      setFormOpen(false);
      reset();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await assignmentService.delete(deleteTarget._id);
      toast.success('Assignment deleted');
      queryClient.invalidateQueries('admin-created-assignments');
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Create assignments and grade submissions</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> Create Assignment
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a._id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0">
                <FiCheckSquare size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{a.title}</p>
                <p className="text-xs text-gray-500">{a.course?.title} • Due {new Date(a.deadline).toLocaleDateString('en-IN')}</p>
              </div>
              <button onClick={() => setSubmissionsTarget(a)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                <FiUsers size={13} /> Submissions ({a.totalSubmissions || 0})
              </button>
              <button onClick={() => setDeleteTarget(a)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all">
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FiCheckSquare} title="No assignments created yet" description="Create your first assignment for a course"
          action={<button onClick={() => setFormOpen(true)} className="btn-primary">Create Assignment</button>} />
      )}

      {/* Create form */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Create Assignment" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course</label>
            <select {...register('course', { required: 'Required' })} className="input">
              <option value="">Select a course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input {...register('title', { required: 'Required' })} className="input" placeholder="e.g. Build a Todo App" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description', { required: 'Required' })} rows={4} className="input resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deadline</label>
            <input {...register('deadline', { required: 'Required' })} type="datetime-local" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Marks</label>
              <input {...register('maxMarks', { required: true, min: 1 })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Passing Marks</label>
              <input {...register('passingMarks', { required: true, min: 0 })} type="number" className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input {...register('allowLateSubmission')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" />
            Allow late submissions
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : null} Create
            </button>
          </div>
        </form>
      </Modal>

      {submissionsTarget && (
        <SubmissionsModal assignment={submissionsTarget} onClose={() => setSubmissionsTarget(null)} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message={`Delete "${deleteTarget?.title}"? All student submissions for it will remain in the database but become inaccessible from this UI.`}
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};

const SubmissionsModal = ({ assignment, onClose }) => {
  const queryClient = useQueryClient();
  const [grading, setGrading] = useState(null);
  const [marks, setMarks] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery(
    ['assignment-submissions', assignment._id],
    () => assignmentService.getSubmissions(assignment._id, { limit: 50 })
  );
  const submissions = data?.data?.data || [];

  const openGrade = (s) => {
    setGrading(s);
    setMarks(s.marks ?? '');
    setRemarks(s.remarks ?? '');
  };

  const handleGrade = async () => {
    if (marks === '') { toast.error('Enter marks'); return; }
    setSaving(true);
    try {
      await assignmentService.gradeSubmission(grading._id, { marks: Number(marks), remarks, grade: '' });
      toast.success('Submission graded');
      queryClient.invalidateQueries(['assignment-submissions', assignment._id]);
      setGrading(null);
    } catch {} finally { setSaving(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Submissions — ${assignment.title}`} size="lg">
      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : submissions.length > 0 ? (
        <div className="space-y-3">
          {submissions.map(s => (
            <div key={s._id} className="card p-4 flex items-center gap-4">
              <img src={s.student?.avatar || `https://ui-avatars.com/api/?name=${s.student?.firstName}&background=6C63FF&color=fff`}
                alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{s.student?.firstName} {s.student?.lastName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(s.submittedAt).toLocaleDateString('en-IN')} {s.isLate && '• Late'} • {s.files?.length || 0} file(s)
                </p>
              </div>
              <span className={`badge text-xs ${s.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                {s.status === 'graded' ? `${s.marks} marks` : 'Pending'}
              </span>
              <button onClick={() => openGrade(s)} className="btn-secondary text-xs px-3 py-1.5">
                {s.status === 'graded' ? 'Edit' : 'Grade'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-10">No submissions yet</p>
      )}

      {grading && (
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-dark-300 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Grading: {grading.student?.firstName} {grading.student?.lastName}
          </p>
          {grading.files?.length > 0 && (
            <div className="space-y-1">
              {grading.files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary-600 hover:underline">
                  📎 {f.originalName}
                </a>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input value={marks} onChange={e => setMarks(e.target.value)} type="number" placeholder="Marks" className="input py-2 text-sm" />
          </div>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Remarks (optional)" className="input resize-none py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setGrading(null)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleGrade} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              {saving ? <Spinner size="sm" /> : null} Save Grade
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AdminAssignments;
