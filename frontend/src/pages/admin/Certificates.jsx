import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { FiAward, FiExternalLink, FiSlash, FiSearch } from 'react-icons/fi';
import { certificateService } from '../../services';
import { Pagination, EmptyState, Spinner, Modal } from '../../components/ui/index.jsx';

const AdminCertificates = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const { data, isLoading } = useQuery(
    ['admin-certificates', page, status, type],
    () => certificateService.getAll({ page, limit: 15, status: status || undefined, type: type || undefined }),
    { keepPreviousData: true }
  );
  const certs = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    if (!revokeReason.trim()) { toast.error('Please provide a reason for revoking'); return; }
    setRevoking(true);
    try {
      await certificateService.revoke(revokeTarget._id, { reason: revokeReason });
      toast.success('Certificate revoked');
      queryClient.invalidateQueries(['admin-certificates']);
      setRevokeTarget(null);
      setRevokeReason('');
    } catch {} finally { setRevoking(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Certificates</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} certificates issued</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
          <option value="">All Types</option>
          <option value="course">Course</option>
          <option value="internship">Internship</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : certs.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['Certificate ID', 'Student', 'Course/Internship', 'Issued', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {certs.map(cert => (
                    <tr key={cert._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{cert.certificateId}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {cert.student?.firstName} {cert.student?.lastName}
                        <p className="text-xs text-gray-400">{cert.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                        <span className="line-clamp-1">{cert.course?.title || cert.internship?.title || cert.courseName || cert.internshipName}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(cert.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${cert.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {cert.status === 'active' ? '✓ Valid' : '✗ Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/verify/${cert.certificateId}`} target="_blank"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 text-gray-500 transition-all" title="View verification page">
                            <FiExternalLink size={14} />
                          </Link>
                          {cert.status === 'active' && (
                            <button onClick={() => setRevokeTarget(cert)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all" title="Revoke">
                              <FiSlash size={14} />
                            </button>
                          )}
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
        <EmptyState icon={FiAward} title="No certificates yet" description="Certificates appear here once students complete courses or internships" />
      )}

      <Modal isOpen={!!revokeTarget} onClose={() => { setRevokeTarget(null); setRevokeReason(''); }} title="Revoke Certificate" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revoking <span className="font-mono font-semibold">{revokeTarget?.certificateId}</span> will mark it as invalid.
            Anyone who scans its QR code or visits its verification link will see "INVALID CERTIFICATE". This cannot be undone automatically.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason for revoking</label>
            <textarea value={revokeReason} onChange={e => setRevokeReason(e.target.value)} rows={3}
              className="input resize-none" placeholder="e.g. Issued in error, plagiarism found, etc." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setRevokeTarget(null); setRevokeReason(''); }} className="btn-secondary" disabled={revoking}>Cancel</button>
            <button onClick={handleRevoke} disabled={revoking}
              className="px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2">
              {revoking ? <Spinner size="sm" /> : <FiSlash size={14} />} Revoke Certificate
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCertificates;
