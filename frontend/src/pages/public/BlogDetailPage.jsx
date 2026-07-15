import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiClock, FiUser, FiTag, FiArrowLeft } from 'react-icons/fi';
import { blogService } from '../../services';
import { Spinner } from '../../components/ui/index.jsx';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const { data, isLoading } = useQuery(['blog', slug], () => blogService.getBySlug(slug));
  const blog = data?.data?.data;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Spinner size="lg" />
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</p>
        <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
        <Link to="/blog" className="btn-primary">Browse All Articles</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 pt-20">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-gray-300 hover:text-white text-sm mb-6 transition-colors">
            <FiArrowLeft size={16} /> Back to Blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {blog.category && (
              <span className="badge-primary">{blog.category.name}</span>
            )}
            {blog.isFeatured && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ Featured</span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">{blog.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
            {blog.author && (
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <FiUser size={14} className="text-white" />
                </div>
                <span className="font-medium">{blog.author.firstName} {blog.author.lastName}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <FiClock size={14} /> {blog.readingTime} min read
            </span>
            <span className="text-gray-400">
              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {blog.thumbnail && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <img
              src={blog.thumbnail}
              alt={blog.title}
              className="w-full max-h-[400px] object-cover rounded-2xl shadow-xl"
            />
          </motion.div>
        )}

        {blog.excerpt && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8 border-l-4 border-primary-500 pl-6 italic"
          >
            {blog.excerpt}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {blog.tags?.length > 0 && (
          <div className="border-t border-gray-100 dark:border-dark-300 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <FiTag size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map(t => (
                <span key={t} className="badge-primary text-xs">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
