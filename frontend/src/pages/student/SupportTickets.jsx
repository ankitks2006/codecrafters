import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiLifeBuoy, FiPlus, FiSend, FiClock, FiMessageSquare } from 'react-icons/fi';
import { supportService } from '../../services';
import { EmptyState, Spinner, Modal, Badge, Pagination } from '../../components/ui/index.jsx';

const STATUS_COLORS = { open: 'info', in_progress: 'warning', resolved: 'success', closed: 'primary' };
const PRIORITY_COLORS = { low: 'primary', medium: 'warning', high: 'danger', critical: 'danger' };

const SupportTickets = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery(
    ['my-tickets', page],
    () => supportService.getMyTickets({ page, limit: 10 }),
    { keepPreviousData: true }
  );
  const tickets = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const { data: ticketDetail, isLoading: detailLoading } = useQuery(
    ['ticket-detail', activeTicket?._id],
    () => supportService.getById(activeTicket._id),
    { enabled: !!activeTicket }
  );
  const detail = ticketDetail?.data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onCreate = async (data) => {
    setCreating(true);
    try {
      await supportService.create(data);
      toast.success('Ticket created! We\'ll respond within 24 hours.');
      queryClient.invalidateQueries(['my-tickets']);
      setCreateOpen(false);
      reset();
    } catch {} finally { setCreating(false); }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await supportService.reply(activeTicket._id, { message: reply });
      setReply('');
      queryClient.invalidateQueries(['ticket-detail', activeTicket._id]);
      toast.success('Reply sent');
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{tickets.length > 0 ? `${pagination.total} tickets` : 'Raise a support request'}</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> New Ticket
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tickets.length > 0 ? (
        <>
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <motion.button key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setActiveTicket(t)}
                className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <FiLifeBuoy size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{t.subject}</p>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="font-mono">{t.ticketId}</span>
                    <span className="flex items-center gap-1"><FiClock size={11} />{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                    {t.replies?.length > 0 && <span className="flex items-center gap-1"><FiMessageSquare size={11} /> {t.replies.length}</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant={STATUS_COLORS[t.status]}>{t.status.replace('_', ' ')}</Badge>
                  <Badge variant={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
                </div>
              </motion.button>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={FiLifeBuoy} title="No tickets yet" description="Have an issue? Our team is here to help."
          action={<button onClick={() => setCreateOpen(true)} className="btn-primary">Create Ticket</button>} />
      )}

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Support Ticket" size="md">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
            <input {...register('subject', { required: 'Subject is required' })} className="input" placeholder="Brief description of your issue" />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <select {...register('category')} className="input">
                {['technical', 'payment', 'course', 'certificate', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
              <select {...register('priority')} className="input">
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'At least 20 characters' } })}
              rows={5} className="input resize-none" placeholder="Describe your issue in detail..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
              {creating ? <Spinner size="sm" /> : <FiSend size={14} />} Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket detail / reply modal */}
      <Modal isOpen={!!activeTicket} onClose={() => setActiveTicket(null)} title={activeTicket?.subject} size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={STATUS_COLORS[detail.status]}>{detail.status.replace('_', ' ')}</Badge>
              <Badge variant={PRIORITY_COLORS[detail.priority]}>{detail.priority} priority</Badge>
              <span className="text-xs text-gray-500 font-mono self-center">{detail.ticketId}</span>
            </div>

            <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{detail.description}</p>
            </div>

            {detail.replies?.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {detail.replies.map((r, i) => (
                  <div key={i} className={`flex gap-3 ${r.isAdminReply ? '' : 'flex-row-reverse'}`}>
                    <div className={`max-w-xs rounded-xl p-3 text-sm ${r.isAdminReply ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200' : 'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300'}`}>
                      {r.isAdminReply && <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1">Support Team</p>}
                      <p className="leading-relaxed">{r.message}</p>
                      <p className="text-xs opacity-60 mt-1">{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detail.status !== 'closed' && (
              <div className="flex gap-2">
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                  placeholder="Reply to the ticket..." className="input resize-none flex-1 py-2 text-sm" />
                <button onClick={handleReply} disabled={submitting || !reply.trim()}
                  className="btn-primary px-4 self-end flex items-center gap-1.5 text-sm">
                  {submitting ? <Spinner size="sm" /> : <FiSend size={14} />} Send
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportTickets;
