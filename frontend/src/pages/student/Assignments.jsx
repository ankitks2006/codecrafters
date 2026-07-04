import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiCheckSquare, FiClock, FiUpload, FiPaperclip, FiX, FiCheckCircle,
  FiDownload, FiAlertCircle, FiFileText,
} from 'react-icons/fi';
import { assignmentService } from '../../services';
import { EmptyState, Spinner, Modal } from '../../components/ui/index.jsx';

const StatusBadge = ({ submission, deadline }) => {
  if (!submission) {
    const isOverdue = new Date(deadline) < new Date();
    return isOverdue
      ? <span className="badge-danger text-xs">Overdue</span>
      : <span className="badge-warning text-xs">Pending</span>;
  }
  if (submission.status === 'graded') return <span className="badge-success text-xs">Graded: {submission.marks}</span>;
  return <span className="badge-info text-xs">Submitted{submission.isLate ? ' (late)' : ''}</span>;
};

const Assignments = () => {
  const queryClient = useQueryClient();
  const [activeAssignment, setActiveAssignment] = useState(null);

  const { data, isLoading } = useQuery('my-assignments', assignmentService.getMyAssignments);
  const assignments = data?.data?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Assignments</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} across your courses</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((a, i) => (
            <motion.button key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setActiveAssignment(a)}
              className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0">
                <FiCheckSquare size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{a.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.course?.title || a.internship?.title}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mb-1">
                  <FiClock size={11} /> {new Date(a.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <EmptyState icon={FiCheckSquare} title="No assignments yet" description="Assignments from your enrolled courses will appear here" />
      )}

      {activeAssignment && (
        <AssignmentDetailModal
          assignment={activeAssignment}
          onClose={() => setActiveAssignment(null)}
          onSubmitted={() => queryClient.invalidateQueries('my-assignments')}
        />
      )}
    </div>
  );
};

const AssignmentDetailModal = ({ assignment, onClose, onSubmitted }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [files, setFiles] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    assignmentService.getById(assignment._id).then(res => {
      setDetail(res.data.data);
    }).catch(() => toast.error('Failed to load assignment details')).finally(() => setLoading(false));
  }, [assignment._id]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 5) { toast.error('Max 5 files allowed'); return; }
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (files.length === 0 && !textAnswer.trim()) {
      toast.error('Add at least a file or a text answer'); return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      if (textAnswer.trim()) formData.append('textAnswer', textAnswer);
      await assignmentService.submit(assignment._id, formData);
      toast.success('Assignment submitted successfully!');
      onSubmitted();
      onClose();
    } catch {
      // error toast via interceptor (e.g. deadline passed, already submitted)
    } finally {
      setSubmitting(false);
    }
  };

  const alreadySubmitted = detail?.submission;
  const isOverdue = new Date(assignment.deadline) < new Date();

  return (
    <Modal isOpen onClose={onClose} title={assignment.title} size="lg">
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge submission={alreadySubmitted} deadline={assignment.deadline} />
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiClock size={12} /> Due {new Date(assignment.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            <span className="text-xs text-gray-500">Max marks: {detail?.assignment?.maxMarks ?? assignment.maxMarks}</span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{detail?.assignment?.description || assignment.description}</p>
          </div>

          {detail?.assignment?.instructions && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Instructions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{detail.assignment.instructions}</p>
            </div>
          )}

          {detail?.assignment?.attachments?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Reference Materials</h3>
              <div className="space-y-2">
                {detail.assignment.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-dark-300 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200 transition-all">
                    <FiDownload size={14} /> {att.title || `Attachment ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {alreadySubmitted ? (
            <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-green-600">
                <FiCheckCircle size={16} />
                <span className="text-sm font-semibold">
                  Submitted {new Date(alreadySubmitted.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {alreadySubmitted.isLate && ' (Late)'}
                </span>
              </div>
              {alreadySubmitted.files?.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {alreadySubmitted.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary-600 hover:underline">
                      <FiPaperclip size={12} /> {f.originalName}
                    </a>
                  ))}
                </div>
              )}
              {alreadySubmitted.textAnswer && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">"{alreadySubmitted.textAnswer}"</p>
              )}
              {alreadySubmitted.status === 'graded' && (
                <div className="bg-white dark:bg-dark-200 rounded-lg p-3 mt-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Marks: {alreadySubmitted.marks} / {detail?.assignment?.maxMarks ?? assignment.maxMarks}
                  </p>
                  {alreadySubmitted.remarks && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alreadySubmitted.remarks}</p>
                  )}
                </div>
              )}
            </div>
          ) : isOverdue && !detail?.assignment?.allowLateSubmission ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-start gap-2.5">
              <FiAlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">
                The submission deadline has passed and late submissions are not allowed for this assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Submission</h3>
              {isOverdue && (
                <p className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2">
                  ⚠ Deadline has passed — this will be marked as a late submission.
                </p>
              )}
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-dark-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-all">
                <FiUpload size={22} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to attach files (max 5, 50MB each)</p>
              </div>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-dark-300 rounded-lg px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 truncate">
                        <FiFileText size={13} /> {f.name}
                      </span>
                      <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)} rows={3}
                placeholder="Optional text answer or notes for the reviewer..." className="input resize-none" />

              <button onClick={handleSubmit} disabled={submitting} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                {submitting ? <><Spinner size="sm" /> Submitting...</> : 'Submit Assignment'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default Assignments;
