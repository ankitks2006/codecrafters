import { useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { internshipService, paymentService, enrollmentService } from '../../services';
import { InternshipCard } from '../../components/cards/CourseCard';
import { SkeletonCard, Pagination, EmptyState, Spinner, Modal } from '../../components/ui/index.jsx';
import { FiBriefcase, FiSearch, FiClock, FiUsers, FiAward, FiCheck, FiMapPin } from 'react-icons/fi';

export const InternshipsPage = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [payModal, setPayModal] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const page = Number(params.get('page') || 1);

  const filters = { page, limit: 9, search: params.get('search') || undefined, type: params.get('type') || undefined };
  const { data, isLoading } = useQuery(['internships', filters], () => internshipService.getAll(filters), { keepPreviousData: true });
  const internships = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const setFilter = (key, val) => {
    const p = new URLSearchParams(params);
    if (val) p.set(key, val); else p.delete(key);
    p.set('page', '1'); setParams(p);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20">
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Internship Programs</h1>
          <p className="text-gray-300 mb-8">Real experience. Real projects. Real certificates.</p>
          <form onSubmit={e => { e.preventDefault(); setFilter('search', search); }} className="flex gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search internships..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-3 mb-8 flex-wrap">
          {['remote', 'hybrid', 'onsite'].map(t => (
            <button key={t} onClick={() => setFilter('type', params.get('type') === t ? '' : t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${params.get('type') === t ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300'}`}>
              {t}
            </button>
          ))}
          <p className="ml-auto text-sm text-gray-500 self-center">{pagination.total || 0} programs found</p>
        </div>
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"><SkeletonCard count={6} /></div>
        ) : internships.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map(i => <InternshipCard key={i._id} internship={i} />)}
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={p => setFilter('page', p)} />
          </>
        ) : (
          <EmptyState icon={FiBriefcase} title="No Internships Found" description="Check back soon for new programs." />
        )}
      </div>
    </div>
  );
};

export const InternshipDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const [payModal, setPayModal] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const { data, isLoading } = useQuery(['internship', slug], () => internshipService.getBySlug(slug));
  const internship = data?.data?.data;

  const price = internship?.isPaid ? (internship.discountPrice > 0 ? internship.discountPrice : internship.price) : 0;

  const applyCoupon = async () => {
    if (!coupon) return;
    setCouponLoading(true);
    try {
      const res = await paymentService.validateCoupon({ code: coupon, amount: price });
      setCouponData(res.data.data);
      toast.success(`Coupon applied! You save ₹${res.data.data.discount}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayment = async () => {
    setEnrollLoading(true);
    try {
      const orderRes = await paymentService.createOrder({
        type: 'internship',
        itemId: internship._id,
        couponCode: couponData ? coupon : undefined,
      });
      const { orderId, amount, keyId, paymentId: dbPaymentId } = orderRes.data.data;

      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'Code Crafters Tech',
        description: internship.title,
        order_id: orderId,
        image: '/logo.png',
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: dbPaymentId,
            });
            toast.success('Payment successful! Your internship enrollment is confirmed.');
            setPayModal(false);
            navigate('/dashboard/internships');
          } catch (err) {
            console.error(err);
          }
        },
        prefill: { name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), email: user?.email },
        theme: { color: '#6C63FF' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    } finally {
      setEnrollLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!internship) return <div className="min-h-screen flex items-center justify-center pt-16"><p className="text-gray-500">Internship not found</p></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 pt-16">
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <span className={`badge text-xs mb-4 inline-block ${internship.status === 'active' ? 'badge-success' : 'badge-info'}`}>{internship.status?.toUpperCase()}</span>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">{internship.title}</h1>
          <p className="text-gray-300 mb-6">{internship.shortDescription}</p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-300">
            <span className="flex items-center gap-1.5"><FiClock size={14} /> {internship.duration} weeks</span>
            <span className="flex items-center gap-1.5 capitalize"><FiMapPin size={14} /> {internship.type}</span>
            <span className="flex items-center gap-1.5"><FiUsers size={14} /> {internship.enrollmentCount} enrolled</span>
            {internship.hasCertificate && <span className="flex items-center gap-1.5 text-primary-400"><FiAward size={14} /> Certificate</span>}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          {internship.responsibilities?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What You'll Do</h2>
              <ul className="space-y-2">
                {internship.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiCheck size={14} className="text-green-500 mt-0.5 flex-shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {internship.requirements?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h2>
              <ul className="space-y-2">
                {internship.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-primary-500">•</span> {r}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {internship.projects?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Projects You'll Build</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {internship.projects.map((p, i) => (
                  <div key={i} className="card p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{p.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.description}</p>
                    {p.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.techStack.map(t => <span key={t} className="badge-primary text-xs">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <div>
          <div className="card p-6 sticky top-24">
            <div className="mb-4">
              {price === 0 ? <span className="text-3xl font-black text-green-600">FREE</span> :
                <span className="text-3xl font-black text-gray-900 dark:text-white">₹{price.toLocaleString('en-IN')}</span>}
            </div>
            <button
              onClick={async () => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                if (internship.isEnrolled) {
                  navigate('/dashboard/internships');
                  return;
                }
                if (!internship.isPaid || internship.price === 0) {
                  setEnrollLoading(true);
                  try {
                    await enrollmentService.enrollFree({ type: 'internship', itemId: internship._id });
                    toast.success('Enrolled successfully! 🎉');
                    queryClient.invalidateQueries(['internship', slug]);
                    queryClient.invalidateQueries('internships');
                    navigate('/dashboard/internships');
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setEnrollLoading(false);
                  }
                  return;
                }
                setPayModal(true);
              }}
              disabled={enrollLoading}
              className="w-full btn-primary py-3.5 mb-3">
              {internship.isEnrolled ? 'View Dashboard' : internship.isPaid ? 'Pay & Apply' : 'Apply Now'}
            </button>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {[`Duration: ${internship.duration} weeks`, internship.type, internship.hasCertificate && 'Certificate of Completion', internship.hasLetterOfRecommendation && 'Letter of Recommendation'].filter(Boolean).map(item => (
                <div key={item} className="flex items-center gap-2"><FiCheck size={13} className="text-green-500" /> {item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Pay & Apply" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coupon Code</label>
            <div className="flex gap-2">
              <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Enter coupon code"
                className="input flex-1" />
              <button type="button" onClick={applyCoupon}
                disabled={couponLoading || !coupon}
                className="btn-secondary px-4 py-2">
                {couponLoading ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {couponData && (
              <p className="text-sm text-green-600 mt-2">Coupon applied — save ₹{couponData.discount.toLocaleString('en-IN')}.</p>
            )}
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-dark-300 p-4 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-2">Payment summary</p>
            <div className="flex justify-between"><span>Subtotal</span><span>₹{price.toLocaleString('en-IN')}</span></div>
            {couponData && <div className="flex justify-between"><span>Discount</span><span>-₹{couponData.discount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between"><span>GST (18%)</span><span>₹{Math.round(((price - (couponData?.discount || 0)) * 1.18 - (price - (couponData?.discount || 0))).toFixed(0)).toLocaleString('en-IN')}</span></div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-400 font-semibold flex justify-between">
              <span>Total</span>
              <span>₹{Math.round(((price - (couponData?.discount || 0)) * 1.18)).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button type="button" onClick={handlePayment}
            disabled={enrollLoading}
            className="w-full btn-primary py-3.5">
            {enrollLoading ? 'Processing...' : 'Pay & Apply'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default InternshipsPage;
