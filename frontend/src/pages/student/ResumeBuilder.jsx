import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiDownload, FiUser, FiBriefcase, FiBook, FiCode, FiFileText } from 'react-icons/fi';
import { enrollmentService, certificateService } from '../../services';

const ResumeBuilder = () => {
  const { user } = useSelector(s => s.auth);
  const [template, setTemplate] = useState('modern');
  const [printing, setPrinting] = useState(false);

  const { data: enrollData } = useQuery('resume-courses', () => enrollmentService.getMyEnrollments({ type: 'course', status: 'completed' }));
  const { data: certData } = useQuery('resume-certs', certificateService.getMyCertificates);

  const completedCourses = enrollData?.data?.data || [];
  const certificates = certData?.data?.data || [];

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 300);
  };

  const templates = [
    { id: 'modern', label: 'Modern', color: 'from-primary-600 to-purple-600' },
    { id: 'minimal', label: 'Minimal', color: 'from-gray-700 to-gray-900' },
    { id: 'classic', label: 'Classic', color: 'from-blue-700 to-blue-900' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Resume Builder</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Auto-generated from your profile and completed courses</p>
        </div>
        <button onClick={handlePrint} disabled={printing}
          className="btn-primary flex items-center gap-2 text-sm">
          <FiDownload size={16} /> {printing ? 'Preparing...' : 'Download PDF'}
        </button>
      </div>

      {/* Template selector */}
      <div className="flex gap-3">
        {templates.map(t => (
          <button key={t.id} onClick={() => setTemplate(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${template === t.id ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Resume preview */}
      <motion.div id="resume-print" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden shadow-xl print:shadow-none">

        {/* Header */}
        <div className={`bg-gradient-to-r ${templates.find(t => t.id === template)?.color} p-8 text-white`}>
          <div className="flex items-start gap-5">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=fff&color=6C63FF&size=80`}
              alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30"
            />
            <div>
              <h2 className="text-3xl font-black">{user?.firstName} {user?.lastName}</h2>
              <p className="text-white/80 mt-1">{user?.bio || 'Tech Enthusiast | Code Crafters Tech Graduate'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/70">
                {user?.email && <span>📧 {user.email}</span>}
                {user?.phone && <span>📱 {user.phone}</span>}
                {user?.address?.city && <span>📍 {user.address.city}, {user.address.state}</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {user?.socialLinks?.github && <a href={user.socialLinks.github} className="text-xs text-white/70 hover:text-white">GitHub</a>}
                {user?.socialLinks?.linkedin && <a href={user.socialLinks.linkedin} className="text-xs text-white/70 hover:text-white">LinkedIn</a>}
                {user?.socialLinks?.portfolio && <a href={user.socialLinks.portfolio} className="text-xs text-white/70 hover:text-white">Portfolio</a>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Skills */}
          {user?.skills?.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-dark-300 pb-2">
                <FiCode size={18} className="text-primary-500" /> Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-dark-300 pb-2">
                <FiFileText size={18} className="text-primary-500" /> Certifications
              </h3>
              <div className="space-y-2">
                {certificates.filter(c => c.status === 'active').map(cert => (
                  <div key={cert._id} className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{cert.courseName || cert.internshipName}</p>
                      <p className="text-xs text-gray-500">Code Crafters Tech • ID: {cert.certificateId}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(cert.issueDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {user?.education?.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-dark-300 pb-2">
                <FiBook size={18} className="text-primary-500" /> Education
              </h3>
              <div className="space-y-3">
                {user.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{edu.degree} in {edu.field}</p>
                      <p className="text-xs text-gray-500">{edu.institution}</p>
                      {edu.grade && <p className="text-xs text-gray-400">Grade: {edu.grade}</p>}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{edu.startYear} – {edu.endYear || 'Present'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-dark-300 pb-2">
                <FiBriefcase size={18} className="text-primary-500" /> Completed Courses
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {completedCourses.slice(0, 8).map(e => (
                  <div key={e._id} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{e.course?.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completedCourses.length === 0 && certificates.length === 0 && user?.skills?.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <FiUser size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Complete your profile, finish courses, and earn certificates</p>
              <p className="text-xs mt-1">to populate your resume automatically</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body > *:not(#resume-print) { display: none !important; }
          #resume-print { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ResumeBuilder;
