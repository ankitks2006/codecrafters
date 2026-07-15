import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus } from 'react-icons/fi';

const faqs = [
  {
    question: 'How do I enroll in a course?',
    answer: 'Simply browse our courses, select the one you want, and click "Enroll Now". You can pay using Razorpay or UPI. Once payment is confirmed, you will get immediate access to the course content.',
  },
  {
    question: 'Are the certificates verified?',
    answer: 'Yes, all certificates issued by TheSkillCoder are digitally verified. You can share your certificate with employers, and they can verify its authenticity using the certificate ID on our verification page.',
  },
  {
    question: 'Can I access courses on mobile?',
    answer: 'Absolutely. Our platform is fully responsive and works on all devices including smartphones, tablets, and desktops. You can learn anytime, anywhere.',
  },
  {
    question: 'What if I am not satisfied with a course?',
    answer: 'We offer a 30-day money-back guarantee. If you are not satisfied with your course, contact our support team within 30 days of purchase for a full refund.',
  },
  {
    question: 'How do internships work?',
    answer: 'Our internships are structured programs that combine learning with real-world projects. You will be assigned a mentor, complete weekly tasks, and receive a certificate upon successful completion.',
  },
  {
    question: 'Is there any prerequisite for courses?',
    answer: 'Most of our beginner courses have no prerequisites. Intermediate and advanced courses may require basic knowledge of programming or specific tools. Check the course description for detailed requirements.',
  },
  {
    question: 'How long do I have access to a course?',
    answer: 'Once enrolled, you have lifetime access to the course material. You can learn at your own pace and revisit lessons anytime.',
  },
  {
    question: 'Do you offer corporate training?',
    answer: 'Yes, we offer customized corporate training solutions. Contact us at corporate@theskillcoder.com for bulk enrollment pricing and tailored curriculum options.',
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20 pb-16">
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4">Frequently Asked Questions</motion.h1>
          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto">
            Find answers to common questions about our courses, internships, and platform.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors"
              >
                <span className="text-base font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                  {openIndex === i ? <FiMinus size={16} /> : <FiPlus size={16} />}
                </span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Still have questions?</p>
          <a href="/contact" className="btn-primary inline-flex items-center gap-2">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
