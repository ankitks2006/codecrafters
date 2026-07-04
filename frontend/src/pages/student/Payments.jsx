import { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiCreditCard, FiDownload, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { paymentService } from '../../services';
import { EmptyState, Spinner, Pagination } from '../../components/ui/index.jsx';

const STATUS = { captured: { label: 'Paid', color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: FiCheckCircle }, refunded: { label: 'Refunded', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: FiCheckCircle }, failed: { label: 'Failed', color: 'text-red-500 bg-red-50 dark:bg-red-900/20', icon: FiXCircle }, created: { label: 'Pending', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20', icon: FiClock } };

const Payments = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(['payment-history', page], () => paymentService.getHistory({ page, limit: 10 }), { keepPreviousData: true });
  const payments = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Payment History</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} transaction{pagination.total !== 1 ? 's' : ''}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : payments.length > 0 ? (
        <>
          <div className="space-y-3">
            {payments.map((p, i) => {
              const s = STATUS[p.status] || STATUS.created;
              const Icon = s.icon;
              return (
                <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {p.course?.title || p.internship?.title || 'Course / Internship'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span className="capitalize badge text-xs font-mono">{p.type}</span>
                      {p.paidAt && <span>{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                      {p.invoiceNumber && <span className="font-mono">{p.invoiceNumber}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white">₹{p.amountInRupees?.toLocaleString('en-IN')}</p>
                    <span className={`text-xs font-semibold ${s.color.split(' ')[0]}`}>{s.label}</span>
                  </div>
                  {p.razorpayPaymentId && (
                    <a href={`https://rzp.io/i/${p.razorpayOrderId}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-500 transition-all" title="Download receipt">
                      <FiDownload size={15} />
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={FiCreditCard} title="No payments yet" description="Your payment history will appear here after enrolling in a paid course or internship" />
      )}
    </div>
  );
};

export default Payments;
