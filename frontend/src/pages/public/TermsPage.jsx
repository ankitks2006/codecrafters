import { motion } from 'framer-motion';

const TermsPage = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: `By accessing or using TheSkillCoder platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.`,
    },
    {
      title: 'User Accounts',
      content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      title: 'Courses & Enrollments',
      content: `All courses and internships listed on our platform are subject to availability. We reserve the right to modify, suspend, or discontinue any course or internship at any time. Enrollment grants you a non-exclusive, non-transferable license to access the course content for personal, non-commercial use.`,
    },
    {
      title: 'Payments & Refunds',
      content: `All payments are processed securely through our payment partners. Course fees are non-refundable unless otherwise specified in our Refund Policy. We offer a 30-day money-back guarantee on select courses.`,
    },
    {
      title: 'Intellectual Property',
      content: `All content on TheSkillCoder, including text, graphics, logos, videos, and software, is the property of TheSkillCoder and is protected by intellectual property laws. You may not copy, reproduce, or distribute any content without prior written permission.`,
    },
    {
      title: 'User Conduct',
      content: `You agree not to: (a) use the platform for any illegal purpose; (b) attempt to gain unauthorized access to any part of the platform; (c) share your account credentials with others; (d) engage in any activity that disrupts or interferes with the platform.`,
    },
    {
      title: 'Limitation of Liability',
      content: `TheSkillCoder shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform.`,
    },
    {
      title: 'Changes to Terms',
      content: `We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the new terms.`,
    },
    {
      title: 'Contact Us',
      content: `For questions about these Terms and Conditions, please contact us at legal@theskillcoder.com or write to us at TheSkillCoder, Bangalore, Karnataka, India.`,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 pt-20 pb-16">
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4">Terms & Conditions</motion.h1>
          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto">
            Last updated: July 2025
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 mb-6">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Welcome to TheSkillCoder. These Terms and Conditions govern your use of our platform and services. By accessing or using our services, you agree to comply with and be bound by these terms.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{section.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
