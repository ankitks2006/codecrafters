import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiCheckCircle } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { supportService } from '../../services';
import { Spinner } from '../../components/ui/index.jsx';

const ContactPage = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { subject: '', description: '', category: 'general', priority: 'medium' }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await supportService.create(data);
      toast.success('Message sent! We will get back to you within 24 hours.');
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: FiMail, label: 'Email', value: 'contact@theskillcoder.com', href: 'mailto:contact@theskillcoder.com' },
    { icon: FiPhone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: FiMapPin, label: 'Office', value: 'Bangalore, Karnataka, India', href: null },
    { icon: FiClock, label: 'Working Hours', value: 'Mon - Fri, 9:00 AM - 6:00 PM', href: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
            className="text-4xl md:text-5xl font-black text-white mb-4">Contact Us</motion.h1>
          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto">
            Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-5 flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 transition-colors">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Map placeholder */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card overflow-hidden"
            >
              <div className="aspect-video bg-gray-200 dark:bg-dark-300 flex items-center justify-center">
                <div className="text-center">
                  <FiMapPin size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bangalore, Karnataka, India</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="card p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Send us a message</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fill out the form below and we will get back to you within 24 hours.
                </p>
              </div>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <FiCheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    Thank you for reaching out. Our team will review your message and respond within 24 hours.
                  </p>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-10">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to send us a message.</p>
                  <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                    Login to Contact Us
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                      <input
                        defaultValue={`${user?.firstName || ''} ${user?.lastName || ''}`}
                        disabled
                        className="input bg-gray-100 dark:bg-dark-300 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">Logged in as {user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                      <input
                        {...register('subject', { required: 'Subject is required' })}
                        className="input"
                        placeholder="How can we help?"
                      />
                      {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                      <select {...register('category')} className="input">
                        <option value="general">General Inquiry</option>
                        <option value="technical">Technical Support</option>
                        <option value="billing">Billing & Payments</option>
                        <option value="courses">Courses Related</option>
                        <option value="internships">Internships Related</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                      <select {...register('priority')} className="input">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                    <textarea
                      {...register('description', { required: 'Message is required' })}
                      rows={6}
                      className="input resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">We typically respond within 24 hours.</p>
                    <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                      {submitting ? <><Spinner size="sm" /> Sending...</> : <><FiSend size={16} /> Send Message</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
