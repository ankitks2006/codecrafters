import { motion } from 'framer-motion';
import {
  FiTarget, FiEye, FiUsers, FiAward, FiBookOpen,
  FiZap, FiArrowRight,
} from 'react-icons/fi';

const AboutPage = () => {
  const features = [
    { icon: FiBookOpen, title: 'Expert-Led Courses', description: 'Learn from industry professionals with real-world experience' },
    { icon: FiZap, title: 'Hands-On Projects', description: 'Build portfolio-worthy projects with practical, job-ready skills' },
    { icon: FiAward, title: 'Verified Certificates', description: 'Earn recognized certificates to boost your career prospects' },
    { icon: FiUsers, title: 'Community Support', description: 'Join a vibrant community of learners and mentors' },
  ];

  const stats = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '200+', label: 'Courses Available' },
    { value: '50+', label: 'Industry Experts' },
    { value: '4.8/5', label: 'Average Rating' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      <div className="relative bg-gradient-to-br from-dark-900 to-dark-200 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
            className="text-4xl md:text-5xl font-black text-white mb-6">About TheSkillCoder</motion.h1>
          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Empowering the next generation of tech professionals through world-class education, hands-on projects, and industry connections.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
              <FiTarget size={24} className="text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To bridge the gap between academic learning and industry requirements by providing practical, job-ready skills through cutting-edge courses and real-world projects.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <FiEye size={24} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Our Vision</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To become India's most trusted platform for tech education, where every learner can transform their career and achieve their full potential.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-dark-300/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="text-3xl md:text-4xl font-black text-primary-600 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Why Choose Us</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            We combine the best of technology and pedagogy to deliver an unmatched learning experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                <feature.icon size={20} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Start Your Journey?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who have already transformed their careers with TheSkillCoder.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <a href="/courses" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors">
              Explore Courses <FiArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
