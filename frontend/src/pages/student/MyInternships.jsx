import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiBriefcase, FiClock, FiAward, FiFileText, FiCheckCircle, FiSend } from 'react-icons/fi';
import { enrollmentService, internshipService } from '../../services';
import { EmptyState, Spinner, Modal, ProgressBar, Badge } from '../../components/ui/index.jsx';

const MyInternships = () => {
  const queryClient = useQueryClient();
  const [reportTarget, setReportTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data, isLoading } = useQuery(
    'my-internship-enrollments',
    () => enrollmentService.getMyEnrollments({ type: 'internship' })
  );
  const enrollments = data?.data?.data || [];

  const onSubmitReport = async (formData) => {
    setSubmitting(true);
    try {
      await internshipService.submitWeeklyReport(reportTarget.internship._id, {
        week: formData.week,
        report: formData.report,
      });
      toast.success('Weekly report submitted!');
      queryClient.invalidateQueries('my-internship-enrollments');
      setReportTarget(null);
      reset();
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Internships</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{enrollments.length} internship{enrollments.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <Link to="/internships" className="btn-secondary text-sm">Browse Programs</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : enrollments.length > 0 ? (
        <div className="space-y-4">
          {enrollments.map((enrollment, i) => {
            const internship = enrollment.internship;
            if (!internship) return null;
            const weeksSubmitted = enrollment.weeklyReports?.length || 0;

            return (
              <motion.div key={enrollment._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={internship.thumbnail || 'https://placehold.co/80x60/4f46e5/white?text=Intern'}
                      alt="" className="w-16 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white">{internship.title}</h3>
                        <Badge variant={enrollment.internshipStatus === 'completed' ? 'success' : enrollment.internshipStatus === 'in_progress' ? 'info' : 'warning'}>
                          {enrollment.internshipStatus?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><FiClock size={11} /> {internship.duration} weeks</span>
                        <span className="capitalize">{internship.type}</span>
                        {internship.hasCertificate && <span className="flex items-center gap-1 text-primary-600"><FiAward size={11} /> Certificate</span>}
                      </div>
                    </div>
                  </div>

                  <ProgressBar value={enrollment.progress || 0} size="sm" />
                  <p className="text-xs text-gray-500 mt-1 mb-4">{enrollment.progress || 0}% progress</p>

                  {/* Weekly reports status */}
                  <div className="bg-gray-50 dark:bg-dark-300 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Reports</span>
                      <span className="text-xs text-gray-500">{weeksSubmitted} submitted</span>
                    </div>
                    {enrollment.weeklyReports?.length > 0 ? (
                      <div className="space-y-1.5">
                        {enrollment.weeklyReports.slice(-3).map((r, wi) => (
                          <div key={wi} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Week {r.week}</span>
                            <div className="flex items-center gap-2">
                              <FiCheckCircle size={12} className="text-green-500" />
                              {r.mentorFeedback && <span className="text-primary-600">Feedback received</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No reports submitted yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {enrollment.internshipStatus !== 'completed' && (
                      <button onClick={() => setReportTarget(enrollment)}
                        className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-1.5">
                        <FiFileText size={14} /> Submit Weekly Report
                      </button>
                    )}
                    {enrollment.certificateIssued && (
                      <Link to="/dashboard/certificates" className="flex-1 btn-secondary text-sm py-2.5 flex items-center justify-center gap-1.5">
                        <FiAward size={14} /> View Certificate
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={FiBriefcase} title="No internships enrolled" description="Browse our internship programs and kickstart your career"
          action={<Link to="/internships" className="btn-primary">Browse Internships</Link>} />
      )}

      {/* Weekly Report Modal */}
      <Modal isOpen={!!reportTarget} onClose={() => { setReportTarget(null); reset(); }}
        title={`Submit Weekly Report — ${reportTarget?.internship?.title}`} size="md">
        <form onSubmit={handleSubmit(onSubmitReport)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Week Number</label>
            <input {...register('week', { required: 'Required', min: { value: 1, message: 'At least week 1' } })}
              type="number" className="input" placeholder="e.g. 1" />
            {errors.week && <p className="text-red-500 text-xs mt-1">{errors.week.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Report</label>
            <textarea
              {...register('report', { required: 'Required', minLength: { value: 50, message: 'At least 50 characters' } })}
              rows={6} className="input resize-none"
              placeholder="Describe what you worked on this week, what you learned, any challenges faced, and your plans for next week..."
            />
            {errors.report && <p className="text-red-500 text-xs mt-1">{errors.report.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setReportTarget(null); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? <Spinner size="sm" /> : <FiSend size={14} />} Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyInternships;
