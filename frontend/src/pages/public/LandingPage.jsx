import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  FiArrowRight, FiPlay, FiStar, FiUsers, FiAward, FiBook,
  FiCheck, FiZap, FiShield, FiTrendingUp, FiCode,
} from 'react-icons/fi';
import { courseService, internshipService } from '../../services';
import CourseCard from '../../components/cards/CourseCard';
import InternshipCard from '../../components/cards/InternshipCard';

const stats = [
  { label: 'Students Enrolled', value: '15,000+', icon: FiUsers, color: 'primary' },
  { label: 'Courses Available', value: '200+', icon: FiBook, color: 'blue' },
  { label: 'Certificates Issued', value: '8,500+', icon: FiAward, color: 'green' },
  { label: 'Placement Rate', value: '94%', icon: FiTrendingUp, color: 'orange' },
];

const features = [
  { icon: FiCode, title: 'Industry Projects', desc: 'Work on real-world projects with production code & best practices.' },
  { icon: FiAward, title: 'Verified Certificates', desc: 'QR-verified certificates recognized by top companies across India.' },
  { icon: FiZap, title: 'Live Sessions', desc: 'Weekly live classes, doubt sessions & mentorship from industry experts.' },
  { icon: FiShield, title: 'Job Assistance', desc: 'Resume building, mock interviews, and dedicated placement support.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'SDE at Amazon', img: 'https://randomuser.me/api/portraits/women/44.jpg', text: 'Code Crafters Tech transformed my career. The internship program gave me real experience that landed me my dream job.' },
  { name: 'Rahul Gupta', role: 'Full Stack Dev at Flipkart', img: 'https://randomuser.me/api/portraits/men/32.jpg', text: 'The courses are top-notch. I went from zero to building full-stack apps in just 3 months. Highly recommend!' },
  { name: 'Ananya Patel', role: 'Data Scientist at Infosys', img: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'The certificate I earned here helped me clear interviews. The QR verification feature impressed every interviewer.' },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const LandingPage = () => {
  const { data: coursesData } = useQuery('featured-courses', () => courseService.getAll({ limit: 6, isFeatured: true }));
  const { data: internshipsData } = useQuery('featured-internships', () => internshipService.getAll({ limit: 3, isFeatured: true }));

  const courses = coursesData?.data?.data || [];
  const internships = internshipsData?.data?.data || [];

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-dark-900 via-dark-100 to-dark-200 overflow-hidden pt-16">
        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-900/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp}
                className="inline-flex items-center gap-2 bg-primary-900/30 text-primary-300 border border-primary-700/50 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <FiZap size={14} />
                India's #1 Tech Learning Platform
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
                Build Your{' '}
                <span className="text-gradient">Dream</span>{' '}
                Tech Career
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
                Master in-demand skills through industry-relevant courses, real internship programs, and live mentorship. Get placement-ready with verified certificates.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-10">
                <Link to="/courses" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5 shadow-glow-lg">
                  Explore Courses <FiArrowRight size={18} />
                </Link>
                <Link to="/internships" className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition-all text-base">
                  <FiPlay size={16} /> View Internships
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-6">
                {[
                  '✅ No prior experience needed',
                  '✅ Certificate on completion',
                  '✅ Job placement support',
                ].map(item => (
                  <span key={item} className="text-sm text-gray-400">{item}</span>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero visual */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 gradient-primary rounded-3xl opacity-20 blur-2xl" />
                <div className="relative glass-dark rounded-3xl p-8 border border-white/10">
                  {/* Mock dashboard */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">S</div>
                        <div>
                          <div className="h-3 w-28 bg-white/20 rounded mb-1.5" />
                          <div className="h-2 w-20 bg-white/10 rounded" />
                        </div>
                      </div>
                      <div className="badge-success text-xs">Active</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[['Courses', '12', '🎓'], ['Certificates', '4', '🏆'], ['Progress', '78%', '📈'], ['Streak', '21 days', '🔥']].map(([l, v, e]) => (
                        <div key={l} className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <div className="text-xl mb-1">{e}</div>
                          <div className="text-white font-bold text-lg">{v}</div>
                          <div className="text-gray-400 text-xs">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>React.js Course</span><span>78%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <motion.div className="bg-primary-500 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 1.5, delay: 1 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg">
                  🎯 New Certificate!
                </motion.div>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity }}
                  className="absolute -bottom-4 -left-4 bg-white text-gray-900 px-3 py-2 rounded-xl text-sm font-bold shadow-lg">
                  ⭐ 4.9/5 Rating
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 bg-white dark:bg-dark-100 border-y border-gray-100 dark:border-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(s => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <p className="text-4xl font-black text-primary-600 dark:text-primary-400 mb-1">{s.value}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-primary-600 dark:text-primary-400 font-semibold mb-3">Why Choose Us</motion.p>
            <motion.h2 variants={fadeUp} className="section-title mb-4">Everything You Need to Succeed</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              From beginner-friendly courses to advanced internship programs, we have everything to kickstart your tech career.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -4 }}
                className="card p-6 hover:shadow-glow transition-shadow duration-300">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED COURSES ── */}
      {courses.length > 0 && (
        <section className="py-20 bg-white dark:bg-dark-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-primary-600 dark:text-primary-400 font-semibold mb-1">Featured Courses</p>
                <h2 className="section-title">Learn from the Best</h2>
              </div>
              <Link to="/courses" className="btn-secondary hidden sm:flex items-center gap-2">
                View All <FiArrowRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => <CourseCard key={course._id} course={course} />)}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link to="/courses" className="btn-primary">View All Courses</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── INTERNSHIPS ── */}
      {internships.length > 0 && (
        <section className="py-20 bg-gray-50 dark:bg-dark-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-primary-600 dark:text-primary-400 font-semibold mb-1">Internship Programs</p>
                <h2 className="section-title">Real Experience, Real Growth</h2>
              </div>
              <Link to="/internships" className="btn-secondary hidden sm:flex items-center gap-2">
                View All <FiArrowRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map(i => <InternshipCard key={i._id} internship={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-primary-600 dark:text-primary-400 font-semibold mb-2">Student Success</p>
            <h2 className="section-title">Hear From Our Alumni</h2>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -4 }} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <FiStar key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Start Your Journey?</h2>
            <p className="text-primary-100 text-lg mb-8">Join 15,000+ students already learning and growing with Code Crafters Tech.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-50 font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">
                Start Free Today →
              </Link>
              <Link to="/courses" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-xl transition-all">
                Browse Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
