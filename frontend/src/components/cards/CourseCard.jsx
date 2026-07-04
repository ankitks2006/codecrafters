import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiUsers, FiClock, FiAward, FiBarChart2, FiPlay } from 'react-icons/fi';

// ─── Course Card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course }) => {
  const price = course.discountPrice > 0 ? course.discountPrice : course.price;
  const isDiscount = course.discountPrice > 0;

  return (
    <motion.div whileHover={{ y: -4 }} className="card overflow-hidden group">
      <Link to={`/courses/${course.slug}`}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnail || 'https://placehold.co/800x450/6C63FF/white?text=Course'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {course.isFeatured && (
            <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              ⭐ Featured
            </span>
          )}
          {isDiscount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {course.discountPercent}% OFF
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <FiPlay size={20} className="text-primary-600 ml-1" />
            </div>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-primary text-xs">{course.category?.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{course.level}</span>
        </div>

        <Link to={`/courses/${course.slug}`}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {course.title}
          </h3>
        </Link>

        {course.instructor && (
          <div className="flex items-center gap-2 mb-3">
            <img
              src={course.instructor.avatar || `https://ui-avatars.com/api/?name=${course.instructor.firstName}&background=6C63FF&color=fff&size=24`}
              alt="" className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {course.instructor.firstName} {course.instructor.lastName}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
          {course.rating > 0 && (
            <span className="flex items-center gap-1">
              <FiStar size={12} className="fill-yellow-400 text-yellow-400" />
              {Number(course.rating).toFixed(1)} ({course.reviewCount})
            </span>
          )}
          <span className="flex items-center gap-1"><FiUsers size={12} /> {course.enrollmentCount}</span>
          <span className="flex items-center gap-1"><FiClock size={12} /> {course.duration}h</span>
          {course.hasCertificate && <span className="flex items-center gap-1"><FiAward size={12} /> Cert</span>}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {price === 0 ? (
              <span className="text-lg font-black text-green-600">FREE</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-gray-900 dark:text-white">₹{price.toLocaleString('en-IN')}</span>
                {isDiscount && (
                  <span className="text-sm text-gray-400 line-through">₹{course.price.toLocaleString('en-IN')}</span>
                )}
              </div>
            )}
          </div>
          <Link to={course.isEnrolled ? `/dashboard/courses/${course._id}/learn` : `/courses/${course.slug}`}
            className="btn-primary text-xs px-4 py-2">
            {course.isEnrolled ? 'Continue' : 'Enroll Now'}
          </Link>
        </div>
        {course.isEnrolled && (
          <div className="mt-2">
            <span className="badge-success text-xs">Enrolled</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseCard;

// ─── Internship Card ──────────────────────────────────────────────────────────
export const InternshipCard = ({ internship }) => (
  <motion.div whileHover={{ y: -4 }} className="card overflow-hidden group">
    <div className="relative aspect-video overflow-hidden">
      <img
        src={internship.thumbnail || 'https://placehold.co/800x450/4f46e5/white?text=Internship'}
        alt={internship.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-2 right-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
          internship.status === 'active' ? 'bg-green-500' :
          internship.status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
        }`}>
          {internship.status?.toUpperCase()}
        </span>
      </div>
    </div>

    <div className="p-5">
      <span className="badge-info text-xs mb-2 inline-block">{internship.type}</span>
      <Link to={`/internships/${internship.slug}`}>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          {internship.title}
        </h3>
      </Link>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{internship.shortDescription}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 gap-4">
        <span className="flex items-center gap-1"><FiClock size={12} /> {internship.duration} weeks</span>
        <span className="flex items-center gap-1"><FiUsers size={12} /> {internship.enrollmentCount} enrolled</span>
        {internship.hasCertificate && <span className="flex items-center gap-1 text-primary-600"><FiAward size={12} /> Certificate</span>}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {!internship.isPaid || internship.price === 0 ? (
            <span className="text-lg font-black text-green-600">FREE</span>
          ) : (
            <span className="text-lg font-black text-gray-900 dark:text-white">₹{internship.price?.toLocaleString('en-IN')}</span>
          )}
        </div>
        <Link to={internship.isEnrolled ? '/dashboard/internships' : `/internships/${internship.slug}`} className="btn-primary text-xs px-4 py-2">
          {internship.isEnrolled ? 'View Dashboard' : 'Apply Now'}
        </Link>
      </div>
      {internship.isEnrolled && (
        <div className="mt-2">
          <span className="badge-success text-xs">Applied</span>
        </div>
      )}
    </div>
  </motion.div>
);
