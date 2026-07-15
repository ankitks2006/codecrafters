import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiAward, FiDownload, FiShare2, FiExternalLink, FiCalendar, FiClock } from 'react-icons/fi';
import { certificateService } from '../../services';
import { EmptyState, Spinner } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const MyCertificates = () => {
  const { data, isLoading } = useQuery('my-certificates', certificateService.getMyCertificates);
  const certs = data?.data?.data || [];

  const handleDownload = async (cert) => {
    try {
      const res = await certificateService.download(cert._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${cert.certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleShare = (cert) => {
    const url = `${window.location.origin}/verify/${cert.certificateId}`;
    if (navigator.share) {
      navigator.share({ title: 'My Certificate - TheSkillCoder', text: `I earned a certificate from TheSkillCoder!`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Verification link copied!');
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Certificates</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{certs.length} certificate{certs.length !== 1 ? 's' : ''} earned</p>
        </div>
        <Link to="/verify/demo" className="btn-secondary text-sm">Verify a Certificate</Link>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          icon={FiAward}
          title="No certificates yet"
          description="Complete a course or internship to earn your first certificate"
          action={<Link to="/courses" className="btn-primary">Start Learning</Link>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certs.map((cert, i) => (
            <motion.div key={cert._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card overflow-hidden ${cert.status === 'revoked' ? 'opacity-60' : ''}`}>
              {/* Certificate preview card */}
              <div className="h-40 gradient-primary relative overflow-hidden flex flex-col items-center justify-center p-6">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
                </div>
                <div className="relative text-center">
                  <FiAward size={32} className="text-yellow-300 mx-auto mb-2" />
                  <p className="text-white/80 text-xs font-medium uppercase tracking-widest">Certificate of Completion</p>
                  <p className="text-white font-bold text-lg mt-1 line-clamp-1">
                    {cert.courseName || cert.internshipName}
                  </p>
                </div>
                {cert.status === 'revoked' && (
                  <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                    <span className="text-red-200 font-black text-xl tracking-widest rotate-[-15deg] border-4 border-red-400 px-6 py-2 rounded">
                      REVOKED
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge text-xs ${cert.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {cert.status === 'active' ? '✓ Valid' : '✗ Revoked'}
                  </span>
                  <span className="badge-info text-xs capitalize">{cert.type}</span>
                </div>

                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FiCalendar size={13} />
                    <span>Issued: {new Date(cert.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FiClock size={13} />
                    <span>{cert.duration}</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-dark-300 rounded-lg px-3 py-2 mb-4">
                  <p className="text-xs text-gray-500 mb-0.5">Certificate ID</p>
                  <p className="font-mono text-xs text-gray-800 dark:text-gray-200 font-semibold">{cert.certificateId}</p>
                </div>

                {cert.status === 'active' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(cert)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                      <FiDownload size={14} /> Download
                    </button>
                    <button onClick={() => handleShare(cert)}
                      className="flex items-center justify-center gap-1.5 px-4 btn-secondary py-2.5 rounded-xl text-sm">
                      <FiShare2 size={14} />
                    </button>
                    <Link to={`/verify/${cert.certificateId}`}
                      className="flex items-center justify-center gap-1.5 px-4 btn-secondary py-2.5 rounded-xl text-sm">
                      <FiExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
