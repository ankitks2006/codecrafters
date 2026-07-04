import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiLifeBuoy, FiSearch, FiSend, FiUser } from 'react-icons/fi';
import { supportService } from '../../services';
import { EmptyState, Spinner, Modal, Badge, Pagination } from '../../components/ui/index.jsx';

const STATUS_COLORS = { open: 'info', in_progress: 'warning', resolved: 'success', closed: 'primary' };
const PRIORITY_COLORS = { low: 'primary', medium: 'warning', high: 'danger', critical: 'danger' };

const AdminSupport = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data, isLoading } = useQuery(
    ['admin-tickets', page, statusFilter, priorityFilter],
    () => supportService.getAll({
      page, limit: 15,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    }),
    { keepPreviousData: true }
  );
  const tickets = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const { data: detailData, isLoading: detailLoading } = useQuery(
    ['admin-ticket-detail', activeTicket?._id],
    () => supportService.getById(activeTicket._id),
    { enabled: !!activeTicket }
  );
  const detail = detailData?.data?.data;

  const handleReply = async () => {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await supportService.reply(activeTicket._id, { message: reply });
      setReply('');
      queryClient.invalidateQueries(['admin-ticket-detail', activeTicket._id]);
      queryClient.invalidateQueries(['admin-tickets']);
      toast.success('Reply sent');
    } catch {} finally { setReplying(false); }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await supportService.updateStatus(activeTicket._id, { status: newStatus });
      toast.success(`Ticket marked as ${newStatus}`);
      queryClient.invalidateQueries(['admin-ticket-detail', activeTicket._id]);
      queryClient.invalidateQueries(['admin-tickets']);
      setActiveTicket(prev => ({ ...prev, status: newStatus }));
    } catch {} finally { setUpdatingStatus(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Support Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} total tickets</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
          <option value="">All Status</option>
          {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
          <option value="">All Priority</option>
          {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tickets.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['Ticket ID', 'Student', 'Subject', 'Priority', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {tickets.map(ticket => (
                    <tr key={ticket._id} onClick={() => setActiveTicket(ticket)}
                      className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{ticket.ticketId}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {ticket.student?.firstName} {ticket.student?.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{ticket.student?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs">
                        <span className="line-clamp-1">{ticket.subject}</span>
                      </td>
                      <td className="px-4 py-3"><Badge variant={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={STATUS_COLORS[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
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
        <EmptyState icon={FiLifeBuoy} title="No tickets found" description="No support tickets match your current filters" />
      )}

      {/* Ticket detail modal */}
      <Modal isOpen={!!activeTicket} onClose={() => setActiveTicket(null)} title={activeTicket?.subject || 'Ticket'} size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={STATUS_COLORS[detail.status]}>{detail.status.replace('_', ' ')}</Badge>
              <Badge variant={PRIORITY_COLORS[detail.priority]}>{detail.priority} priority</Badge>
              <Badge variant="info">{detail.category}</Badge>
              <span className="font-mono text-xs text-gray-400 ml-auto">{detail.ticketId}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-300 rounded-lg px-3 py-2">
              <FiUser size={13} />
              <span>{detail.student?.firstName} {detail.student?.lastName} • {detail.student?.email}</span>
            </div>

            <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {detail.description}
            </div>

            {detail.replies?.length > 0 && (
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {detail.replies.map((r, i) => (
                  <div key={i} className={`flex gap-3 ${r.isAdminReply ? 'flex-row-reverse' : ''}`}>
                    <div className={`max-w-sm rounded-xl p-3 text-sm ${r.isAdminReply ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200' : 'bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300'}`}>
                      {r.isAdminReply && <p className="text-xs font-semibold text-primary-600 mb-1">You (Support)</p>}
                      <p>{r.message}</p>
                      <p className="text-xs opacity-60 mt-1">{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detail.status !== 'closed' && (
              <>
                <div className="flex gap-2">
                  <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                    placeholder="Write your reply..." className="input resize-none flex-1 py-2 text-sm" />
                  <button onClick={handleReply} disabled={replying || !reply.trim()}
                    className="btn-primary px-4 self-end flex items-center gap-1.5 text-sm">
                    {replying ? <Spinner size="sm" /> : <FiSend size={14} />} Reply
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-gray-500 self-center">Change status:</span>
                  {['in_progress', 'resolved', 'closed'].filter(s => s !== detail.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)} disabled={updatingStatus}
                      className="btn-secondary text-xs py-1.5 px-3 capitalize">{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </>
            )}
            {detail.status === 'closed' && (
              <p className="text-xs text-gray-400 text-center py-2">This ticket is closed.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSupport;
