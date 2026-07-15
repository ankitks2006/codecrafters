import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiSearch, FiX, FiFileText, FiClock, FiUser } from 'react-icons/fi';
import { blogService } from '../../services';
import { SkeletonCard, Pagination, EmptyState } from '../../components/ui/index.jsx';

const BlogPage = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const page = Number(params.get('page') || 1);
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';

  const filters = {
    page, limit: 9,
    search: params.get('search') || undefined,
    category: params.get('category') || undefined,
    tag: params.get('tag') || undefined,
    isFeatured: params.get('featured') || undefined,
  };

  const { data, isLoading } = useQuery(['blogs', filters], () => blogService.getAll(filters), { keepPreviousData: true });
  const { data: catData } = useQuery('blog-categories', blogService.getCategories);
  
  const blogs = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};
  const categories = catData?.data?.data || [];

  const setFilter = (key, val) => {
    const p = new URLSearchParams(params);
    if (val) p.set(key, val); else p.delete(key);
    p.set('page', '1');
    setParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter('search', search);
  };

  const clearFilters = () => {
    setSearch('');
    setParams({});
  };

  const hasFilters = params.get('search') || params.get('category') || params.get('tag');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Our Blog</h1>
          <p className="text-gray-300 mb-8">Insights, tutorials, and updates from the tech world</p>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
            </div>
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <select value={category} onChange={e => setFilter('category', e.target.value)}
            className="input w-auto py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
              <FiX size={14} /> Clear filters
            </button>
          )}

          <p className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {pagination.total || 0} articles found
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard count={6} />
          </div>
        ) : blogs.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog, i) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="card overflow-hidden group"
                >
                  <Link to={`/blog/${blog.slug}`}>
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={blog.thumbnail || 'https://placehold.co/800x450/6C63FF/white?text=Blog'}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {blog.isFeatured && (
                        <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {blog.category && (
                        <span className="badge-primary text-xs">{blog.category.name}</span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FiClock size={12} /> {blog.readingTime} min read
                      </span>
                    </div>

                    <Link to={`/blog/${blog.slug}`}>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {blog.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                      {blog.excerpt || blog.content?.replace(/<[^>]*>/g, '').slice(0, 150) + '...'}
                    </p>

                    {blog.author && (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <FiUser size={12} className="text-primary-600" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {blog.author.firstName} {blog.author.lastName}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {blog.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {blog.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-xs text-gray-500 bg-gray-100 dark:bg-dark-300 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={p => setFilter('page', p)} />
          </>
        ) : (
          <EmptyState icon={FiFileText} title="No Articles Found" description="Try adjusting your search or filters." action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>} />
        )}
      </div>
    </div>
  );
};

export default BlogPage;
