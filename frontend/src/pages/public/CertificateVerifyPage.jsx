import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAward, FiCheckCircle, FiXCircle, FiDownload, FiShare2, FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { certificateService } from '../../services';
import { Spinner } from '../../components/ui/index.jsx';

const CertificateVerifyPage = () => {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState('');

  const verify = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await certificateService.verify(id);
      setCert(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId && certificateId !== 'demo') {
      verify(certificateId);
    } else {
      setLoading(false);
    }
  }, [certificateId]);

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (manualId.trim()) verify(manualId.trim());
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Certificate Verification', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
            <FiAward size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Certificate Verification</h1>
          <p className="text-gray-500 dark:text-gray-400">Verify the authenticity of TheSkillCoder certificates</p>
        </motion.div>

        {/* Manual input */}
        {(!certificateId || certificateId === 'demo') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-6 mb-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Enter Certificate ID</h2>
            <form onSubmit={handleManualVerify} className="flex gap-3">
              <input
                value={manualId}
                onChange={e => setManualId(e.target.value.toUpperCase())}
                placeholder="e.g. CCT-A1B2C3D4-K7M9P2"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary px-6" disabled={!manualId.trim()}>
                Verify
              </button>
            </form>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card p-12 text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Verifying certificate...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiXCircle size={36} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Certificate Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <Link to="/verify/demo" className="btn-secondary" onClick={() => { setCert(null); setError(null); }}>
              Try Another
            </Link>
          </motion.div>
        )}

        {/* Valid Certificate */}
        {!loading && cert && cert.isValid && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Status Banner */}
            <div className="bg-green-500 text-white p-4 rounded-t-2xl flex items-center justify-center gap-3">
              <FiCheckCircle size={24} />
              <span className="font-bold text-lg">✅ Valid Certificate</span>
            </div>

            {/* Certificate Details */}
            <div className="card rounded-t-none p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
                  <FiAward size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Certificate of Completion</h2>
                <p className="text-primary-600 dark:text-primary-400 font-semibold">TheSkillCoder</p>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { icon: FiUser, label: 'Student Name', value: cert.studentName },
                  { icon: FiAward, label: cert.type === 'course' ? 'Course' : 'Internship', value: cert.courseName || cert.internshipName },
                  { icon: FiClock, label: 'Duration', value: cert.duration },
                  { icon: FiCalendar, label: 'Issue Date', value: new Date(cert.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-300 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Certificate ID</p>
                <p className="font-mono font-bold text-gray-900 dark:text-white">{cert.certificateId}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleShare} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                  <FiShare2 size={16} /> Share
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Revoked Certificate */}
        {!loading && cert && !cert.isValid && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="bg-red-500 text-white p-4 rounded-t-2xl flex items-center justify-center gap-3">
              <FiXCircle size={24} />
              <span className="font-bold text-lg">⚠️ INVALID CERTIFICATE</span>
            </div>
            <div className="card rounded-t-none p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">This certificate has been revoked or is no longer valid.</p>
              <p className="font-mono text-sm text-gray-500 bg-gray-100 dark:bg-dark-300 px-4 py-2 rounded-lg inline-block">
                {cert.certificateId}
              </p>
            </div>
          </motion.div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          This verification system is maintained by TheSkillCoder.
          For support, contact <a href="mailto:support@theskillcoder.com" className="text-primary-500">support@theskillcoder.com</a>
        </p>
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
