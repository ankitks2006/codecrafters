import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FiStar, FiUsers, FiClock, FiAward, FiCheck, FiPlay,
  FiChevronDown, FiChevronRight, FiLock, FiDownload, FiTag,
} from 'react-icons/fi';
import { courseService, paymentService, enrollmentService } from '../../services';
import { Spinner, Modal } from '../../components/ui/index.jsx';

const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [expandedModules, setExpandedModules] = useState({ 0: true });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [payModal, setPayModal] = useState(false);

  const { data, isLoading } = useQuery(['course', slug], () => courseService.getBySlug(slug));
  const course = data?.data?.data;

  const toggleModule = (i) => setExpandedModules(prev => ({ ...prev, [i]: !prev[i] }));

  const price = course ? (course.discountPrice > 0 ? course.discountPrice : course.price) : 0;
  const isFree = price === 0;

  const applyCoupon = async () => {
    if (!coupon) return;
    setCouponLoading(true);
    try {
      const res = await paymentService.validateCoupon({ code: coupon, amount: price });
      setCouponData(res.data.data);
      toast.success(`Coupon applied! You save ₹${res.data.data.discount}`);
    } catch {} finally { setCouponLoading(false); }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: { pathname: `/courses/${slug}` } } }); return; }
    if (course.isEnrolled) { navigate(`/dashboard/courses/${course._id}/learn`); return; }

    if (isFree) {
      setEnrollLoading(true);
      try {
        await enrollmentService.enrollFree({ type: 'course', itemId: course._id });
        toast.success('Enrolled successfully! 🎉');
        navigate(`/dashboard/courses/${course._id}/learn`);
      } catch {} finally { setEnrollLoading(false); }
      return;
    }

    setPayModal(true);
  };

  const handlePayment = async () => {
    setEnrollLoading(true);
    try {
      const finalPrice = couponData ? price - couponData.discount : price;
      const orderRes = await paymentService.createOrder({
        type: 'course', itemId: course._id,
        couponCode: couponData ? coupon : undefined,
      });
      const { orderId, amount, keyId, paymentId: dbPaymentId } = orderRes.data.data;

      const options = {
        key: keyId, amount, currency: 'INR', name: 'Code Crafters Tech',
        description: course.title, order_id: orderId,
        image: '/logo.png',
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: dbPaymentId,
            });
            toast.success('Payment successful! Welcome to the course 🎉');
            setPayModal(false);
            navigate(`/dashboard/courses/${course._id}/learn`);
          } catch {}
        },
        prefill: { name: `${user?.firstName} ${user?.lastName}`, email: user?.email },
        theme: { color: '#6C63FF' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {} finally { setEnrollLoading(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</p>
        <Link to="/courses" className="btn-primary">Browse Courses</Link>
      </div>
    </div>
  );

  const totalLessons = course.modules?.reduce((a, m) => a + m.lessons?.length, 0) || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-14 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-primary">{course.category?.name}</span>
              <span className="text-gray-400 text-sm capitalize">{course.level}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{course.title}</h1>
            <p className="text-gray-300 mb-6 leading-relaxed">{course.shortDescription}</p>

            <div className="flex flex-wrap gap-6 text-sm text-gray-300 mb-6">
              {course.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <FiStar className="fill-yellow-400 text-yellow-400" size={16} />
                  <strong className="text-yellow-400">{Number(course.rating).toFixed(1)}</strong>
                  ({course.reviewCount} reviews)
                </span>
              )}
              <span className="flex items-center gap-1.5"><FiUsers size={14} /> {course.enrollmentCount?.toLocaleString()} students</span>
              <span className="flex items-center gap-1.5"><FiClock size={14} /> {course.duration} hours</span>
              <span className="flex items-center gap-1.5"><FiPlay size={14} /> {totalLessons} lessons</span>
              {course.hasCertificate && <span className="flex items-center gap-1.5 text-primary-400"><FiAward size={14} /> Certificate</span>}
            </div>

            {course.instructor && (
              <div className="flex items-center gap-3">
                <img src={course.instructor.avatar || `https://ui-avatars.com/api/?name=${course.instructor.firstName}&background=6C63FF&color=fff`}
                  alt="" className="w-10 h-10 rounded-full ring-2 ring-primary-500" />
                <div>
                  <p className="text-xs text-gray-400">Instructor</p>
                  <p className="text-white font-semibold">{course.instructor.firstName} {course.instructor.lastName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky purchase card */}
          <div className="lg:sticky lg:top-24">
            <div className="card overflow-hidden shadow-2xl">
              <div className="relative aspect-video">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                {course.previewVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <FiPlay size={22} className="text-primary-600 ml-1" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-end gap-3 mb-4">
                  {isFree ? (
                    <span className="text-3xl font-black text-green-600">FREE</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-gray-900 dark:text-white">₹{price.toLocaleString('en-IN')}</span>
                      {course.discountPrice > 0 && (
                        <>
                          <span className="text-lg text-gray-400 line-through">₹{course.price.toLocaleString('en-IN')}</span>
                          <span className="badge-danger">{course.discountPercent}% OFF</span>
                        </>
                      )}
                    </>
                  )}
                </div>

                {course.offerEndsAt && new Date(course.offerEndsAt) > new Date() && (
                  <p className="text-xs text-orange-500 font-medium mb-3">
                    ⏰ Offer ends {new Date(course.offerEndsAt).toLocaleDateString('en-IN')}
                  </p>
                )}

                <button onClick={handleEnroll} disabled={enrollLoading}
                  className="w-full btn-primary py-3.5 text-base mb-3 flex items-center justify-center gap-2">
                  {enrollLoading ? <><Spinner size="sm" /> Processing...</> :
                    course.isEnrolled ? '▶ Continue Learning' : isFree ? 'Enroll for Free' : 'Buy Now'}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">30-Day Money-Back Guarantee</p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {[
                    `${totalLessons} lessons in ${course.modules?.length || 0} modules`,
                    `${course.duration} hours of content`,
                    `${course.language || 'English'} language`,
                    course.hasCertificate && 'Certificate of completion',
                    'Lifetime access',
                  ].filter(Boolean).map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <FiCheck size={14} className="text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* What you'll learn */}
            {course.objectives?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You'll Learn</h2>
                <div className="card p-6 grid sm:grid-cols-2 gap-3">
                  {course.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FiCheck size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{obj}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-primary-500 mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Curriculum */}
            {course.modules?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Curriculum</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {course.totalModules} modules • {totalLessons} lessons • {course.duration}h total
                </p>
                <div className="space-y-3">
                  {course.modules.map((mod, mi) => (
                    <div key={mi} className="card overflow-hidden">
                      <button onClick={() => toggleModule(mi)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-300 transition-all text-left">
                        <div className="flex items-center gap-3">
                          {expandedModules[mi] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{mod.title}</p>
                            <p className="text-xs text-gray-500">{mod.lessons?.length} lessons</p>
                          </div>
                        </div>
                      </button>
                      {expandedModules[mi] && (
                        <div className="border-t border-gray-100 dark:border-dark-300 divide-y divide-gray-50 dark:divide-dark-300">
                          {mod.lessons?.map((lesson, li) => (
                            <div key={li} className="flex items-center gap-3 px-4 py-3">
                              {lesson.isFree ? (
                                <FiPlay size={14} className="text-primary-500 flex-shrink-0" />
                              ) : (
                                <FiLock size={14} className="text-gray-400 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{lesson.title}</span>
                              {lesson.isFree && <span className="text-xs text-primary-600 font-medium">Preview</span>}
                              {lesson.videoDuration && (
                                <span className="text-xs text-gray-400">
                                  {Math.floor(lesson.videoDuration / 60)}:{String(lesson.videoDuration % 60).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {course.reviews?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Student Reviews
                  <span className="text-base font-normal text-gray-500 ml-2">({course.reviewCount})</span>
                </h2>
                <div className="space-y-4">
                  {course.reviews.map((review, i) => (
                    <div key={i} className="card p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={review.student?.avatar || `https://ui-avatars.com/api/?name=${review.student?.firstName}&background=6C63FF&color=fff`}
                          alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.student?.firstName} {review.student?.lastName}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, j) => (
                              <FiStar key={j} size={12} className={j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.review}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Description sidebar */}
          <div className="hidden lg:block">
            <div className="card p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">About This Course</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
              {course.tags?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-1 mb-2 text-xs text-gray-500"><FiTag size={12} /> Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map(tag => (
                      <span key={tag} className="badge-primary text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Complete Enrollment" size="md">
        <div className="space-y-5">
          <div className="card p-4 bg-gray-50 dark:bg-dark-300">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">{course.title}</p>
            <p className="text-sm text-gray-500">{totalLessons} lessons • {course.duration}h</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Coupon Code</label>
            <div className="flex gap-2">
              <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                placeholder="Enter coupon code" className="input flex-1 py-2.5" />
              <button onClick={applyCoupon} disabled={couponLoading || !coupon} className="btn-secondary px-4 text-sm">
                {couponLoading ? <Spinner size="sm" /> : 'Apply'}
              </button>
            </div>
            {couponData && (
              <p className="text-green-600 text-xs mt-1.5 font-medium">✅ Coupon applied! Saving ₹{couponData.discount}</p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Original Price</span>
              <span>₹{price.toLocaleString('en-IN')}</span>
            </div>
            {couponData && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({couponData.code})</span>
                <span>-₹{couponData.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>GST (18%)</span>
              <span>₹{Math.round((couponData ? price - couponData.discount : price) * 0.18).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-dark-300 pt-2">
              <span>Total Amount</span>
              <span>₹{Math.round((couponData ? price - couponData.discount : price) * 1.18).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button onClick={handlePayment} disabled={enrollLoading} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2">
            {enrollLoading ? <><Spinner size="sm" /> Processing...</> : '🔒 Pay Securely with Razorpay'}
          </button>
          <p className="text-xs text-center text-gray-400">Secured by Razorpay • 256-bit SSL Encryption</p>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetailPage;
