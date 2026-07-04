import { motion } from 'framer-motion';
const PrivacyPage = () => (
  <div className="min-h-screen pt-20 pb-16 bg-gray-50 dark:bg-dark-900">
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
        className="text-4xl font-black text-gray-900 dark:text-white mb-6">Privacy</motion.h1>
      <p className="text-gray-600 dark:text-gray-400">Content loading...</p>
    </div>
  </div>
);
export default PrivacyPage;
