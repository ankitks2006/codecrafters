import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { FiDollarSign, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import { paymentService } from '../../services';
import { EmptyState, Spinner, Pagination, ConfirmDialog, Modal } from '../../components/ui/index.jsx';

const STATUS_COLORS = { captured: 'badge-success', refunded: 'badge-info', failed: 'badge-danger', created: 'badge-warning' };

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const { data, isLoading } = useQuery(
    ['admin-payments', page],
    () => paymentService.getHistory({ page, limit: 15 }),
    { keepPreviousData: true }
  );
  const payments = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const totalRevenue = payments.filter(p => p.status === 'captured').reduce((sum, p) => sum + p.amountInRupees, 0);

  const handleRefund = async () => {
    if (!refundTarget) return;
    if (!refundReason.trim()) { toast.error('Refund reason is required'); return; }
    setRefunding(true);
    try {
      await paymentService.processRefund(refundTarget._id, { reason: refundReason });
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries(['admin-payments']);
      setRefundTarget(null);
      setRefundReason('');
    } catch {} finally { setRefunding(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} transactions</p>
        </div>
        <div className="card px-5 py-3">
          <p className="text-xs text-gray-500">Page Revenue (Paid)</p>
          <p className="text-xl font-black text-green-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : payments.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['Student', 'Item', 'Amount', 'Invoice', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {p.student?.firstName} {p.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{p.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px]">
                        <span className="line-clamp-1 text-xs">{p.course?.title || p.internship?.title || '—'}</span>
                        <span className="badge-primary text-xs capitalize">{p.type}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        ₹{p.amountInRupees?.toLocaleString('en-IN')}
                        {p.discountAmount > 0 && <p className="text-xs text-green-600">-₹{p.discountAmount} off</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.invoiceNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${STATUS_COLORS[p.status] || 'badge-warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'captured' && (
                          <button onClick={() => setRefundTarget(p)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                            <FiRefreshCcw size={12} /> Refund
                          </button>
                        )}
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
        <EmptyState icon={FiDollarSign} title="No payments yet" description="Payment transactions will appear here" />
      )}

      <Modal isOpen={!!refundTarget} onClose={() => { setRefundTarget(null); setRefundReason(''); }} title="Process Refund" size="sm">
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-4 text-sm">
            <p className="font-medium text-gray-900 dark:text-white">{refundTarget?.course?.title || refundTarget?.internship?.title}</p>
            <p className="text-gray-500 mt-1">Amount: ₹{refundTarget?.amountInRupees?.toLocaleString('en-IN')}</p>
            <p className="text-gray-500">Student: {refundTarget?.student?.firstName} {refundTarget?.student?.lastName}</p>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
            This will initiate a refund via Razorpay and deactivate the student's enrollment. This action cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason</label>
            <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3}
              className="input resize-none" placeholder="Reason for refund..." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setRefundTarget(null); setRefundReason(''); }} className="btn-secondary">Cancel</button>
            <button onClick={handleRefund} disabled={refunding}
              className="px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50">
              {refunding ? <Spinner size="sm" /> : <FiRefreshCcw size={14} />} Process Refund
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPayments;
