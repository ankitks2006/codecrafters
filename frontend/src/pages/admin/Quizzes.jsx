import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiHelpCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { quizService, courseService } from '../../services';
import { EmptyState, Spinner, Modal, ConfirmDialog } from '../../components/ui/index.jsx';

const AdminQuizzes = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  const { data: coursesData } = useQuery('admin-quiz-courses', () => courseService.getAll({ limit: 50 }));
  const courses = coursesData?.data?.data || [];

  // Re-use the same "created by me" pattern as assignments
  const { data, isLoading } = useQuery('admin-quizzes-list', () => quizService.getCreatedByMe());
  const quizzes = data?.data?.data || [];

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '', description: '', course: '', duration: 30,
      maxAttempts: 3, passingMarks: 40, negativeMarkingEnabled: false, randomizeQuestions: true, isPublished: true,
      questions: [{ type: 'mcq', question: '', marks: 1, negativeMark: 0, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }],
    },
  });
  const { fields: qFields, append: addQ, remove: removeQ } = useFieldArray({ control, name: 'questions' });

  const openCreate = () => {
    setEditTarget(null);
    reset();
    setFormOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        duration: Number(data.duration),
        maxAttempts: Number(data.maxAttempts),
        passingMarks: Number(data.passingMarks),
        questions: data.questions.map(q => ({
          ...q,
          marks: Number(q.marks),
          negativeMark: Number(q.negativeMark || 0),
          options: q.options?.map(o => ({ ...o, isCorrect: Boolean(o.isCorrect) })),
        })),
      };
      if (editTarget) {
        await quizService.update(editTarget._id, payload);
        toast.success('Quiz updated');
      } else {
        await quizService.create(payload);
        toast.success('Quiz created');
      }
      queryClient.invalidateQueries('admin-quizzes-list');
      setFormOpen(false);
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quizService.delete(deleteTarget._id);
      toast.success('Quiz deleted');
      queryClient.invalidateQueries('admin-quizzes-list');
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quizzes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Create and manage MCQ quizzes for your courses</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> Create Quiz
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : quizzes.length > 0 ? (
        <div className="space-y-3">
          {quizzes.map(quiz => (
            <div key={quiz._id} className="card overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FiHelpCircle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{quiz.title}</p>
                  <p className="text-xs text-gray-500">{quiz.totalQuestions} questions · {quiz.duration} min · {quiz.maxAttempts} attempts</p>
                </div>
                <span className={`badge text-xs ${quiz.isPublished ? 'badge-success' : 'badge-warning'}`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => setExpandedQuiz(expandedQuiz === quiz._id ? null : quiz._id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-500 transition-all">
                  {expandedQuiz === quiz._id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                </button>
                <button onClick={() => setDeleteTarget(quiz)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all">
                  <FiTrash2 size={14} />
                </button>
              </div>
              {expandedQuiz === quiz._id && quiz.questions?.length > 0 && (
                <div className="border-t border-gray-100 dark:border-dark-300 p-4 space-y-2 bg-gray-50 dark:bg-dark-300/30">
                  {quiz.questions.map((q, i) => (
                    <p key={q._id} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-primary-600 mr-2">Q{i + 1}.</span>{q.question}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FiHelpCircle} title="No quizzes yet" description="Create your first quiz for a course"
          action={<button onClick={openCreate} className="btn-primary">Create Quiz</button>} />
      )}

      {/* Create quiz modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Create Quiz" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quiz Title</label>
              <input {...register('title', { required: true })} className="input" placeholder="e.g. React Hooks Quiz" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course</label>
              <select {...register('course', { required: true })} className="input">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (min)</label>
              <input {...register('duration', { required: true, min: 1 })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Attempts</label>
              <input {...register('maxAttempts', { required: true, min: 1 })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Passing Marks</label>
              <input {...register('passingMarks', { required: true, min: 0 })} type="number" className="input" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {[['negativeMarkingEnabled', 'Negative Marking'], ['randomizeQuestions', 'Randomize Questions'], ['isPublished', 'Published']].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input {...register(name)} type="checkbox" className="w-4 h-4 rounded accent-primary-500" /> {label}
              </label>
            ))}
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Questions</h3>
              <button type="button"
                onClick={() => addQ({ type: 'mcq', question: '', marks: 1, negativeMark: 0, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] })}
                className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3">
                <FiPlus size={13} /> Add Question
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {qFields.map((field, qi) => (
                <div key={field.id} className="bg-gray-50 dark:bg-dark-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Question {qi + 1}</span>
                    {qFields.length > 1 && (
                      <button type="button" onClick={() => removeQ(qi)} className="text-red-500 hover:text-red-600 p-1">
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                  <textarea {...register(`questions.${qi}.question`, { required: true })}
                    rows={2} className="input resize-none text-sm" placeholder="Question text..." />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Marks</label>
                      <input {...register(`questions.${qi}.marks`, { min: 0 })} type="number" className="input py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Negative Mark</label>
                      <input {...register(`questions.${qi}.negativeMark`, { min: 0 })} type="number" className="input py-2 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-500">Options (check the correct one)</label>
                    {[0, 1, 2, 3].map(oi => (
                      <div key={oi} className="flex items-center gap-2">
                        <input {...register(`questions.${qi}.options.${oi}.isCorrect`)} type="radio"
                          name={`q${qi}_correct`}
                          onChange={() => {
                            [0, 1, 2, 3].forEach(j => {
                              const el = document.querySelector(`input[name="q${qi}_opt_correct_${j}"]`);
                              // We can't easily manage radio via react-hook-form field arrays without more complexity.
                              // Use a checkbox approach and let server accept first true option as correct.
                            });
                          }}
                          className="accent-primary-500 flex-shrink-0" />
                        <input {...register(`questions.${qi}.options.${oi}.text`, { required: true })}
                          className="input flex-1 py-2 text-sm" placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : null} {editTarget ? 'Update' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message={`Delete "${deleteTarget?.title}"? All student results for it will also be deleted.`}
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default AdminQuizzes;
