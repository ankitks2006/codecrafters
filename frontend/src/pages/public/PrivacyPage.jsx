import { motion } from 'framer-motion';

const PrivacyPage = () => {
  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, enroll in a course, or contact us. This includes your name, email address, phone number, payment information, and any content you submit through our platform.`,
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to provide, maintain, and improve our services. This includes processing enrollments, sending notifications, personalizing your learning experience, and communicating with you about courses, internships, and platform updates.`,
    },
    {
      title: 'Data Sharing & Disclosure',
      content: `We do not sell your personal data. We may share your information with trusted service providers who assist us in operating our platform, conducting business, or serving our users. This includes payment processors, email service providers, and cloud infrastructure partners.`,
    },
    {
      title: 'Data Security',
      content: `We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
    },
    {
      title: 'Cookies & Tracking',
      content: `We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookie settings through your browser preferences.`,
    },
    {
      title: 'Your Rights',
      content: `You have the right to access, correct, or delete your personal data. You can update your account information through your profile settings. For data deletion requests, please contact us at privacy@theskillcoder.com.`,
    },
    {
      title: 'Contact Us',
      content: `If you have questions about this Privacy Policy, please contact us at privacy@theskillcoder.com or write to us at TheSkillCoder, Bangalore, Karnataka, India.`,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 pt-20 pb-16">
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4">Privacy Policy</motion.h1>
          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto">
            Last updated: July 2025
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 mb-6">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            At TheSkillCoder, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this privacy policy carefully.
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

export default PrivacyPage;
