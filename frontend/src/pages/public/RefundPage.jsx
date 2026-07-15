import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiRefreshCcw } from 'react-icons/fi';

const RefundPage = () => {
  const policies = [
    {
      icon: FiClock,
      title: '30-Day Money-Back Guarantee',
      description: 'If you are not satisfied with your course, you can request a full refund within 30 days of purchase. No questions asked.',
    },
    {
      icon: FiRefreshCcw,
      title: 'Easy Refund Process',
      description: 'Contact our support team with your order details. Refunds are typically processed within 7-10 business days back to your original payment method.',
    },
    {
      icon: FiCheckCircle,
      title: 'Eligibility',
      description: 'Refunds are applicable only for courses purchased directly on our platform. Subscription-based plans may have different refund terms as specified during purchase.',
    },
  ];

  const steps = [
    'Contact our support team at refunds@theskillcoder.com',
    'Provide your order ID and reason for refund',
    'Our team will review your request within 48 hours',
    'Refund will be processed to your original payment method',
    'You will receive a confirmation email once processed',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 pt-20 pb-16">
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4">Refund Policy</motion.h1>
          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto">
            Last updated: July 2025
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 mb-10">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-center max-w-3xl mx-auto">
            At TheSkillCoder, we are committed to your satisfaction. If you are not happy with your purchase, we offer a straightforward refund policy to ensure you have a risk-free learning experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {policies.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <item.icon size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How to Request a Refund</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-black text-primary-600">{i + 1}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href="mailto:refunds@theskillcoder.com" className="text-primary-600 hover:text-primary-500 font-medium">
              refunds@theskillcoder.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
