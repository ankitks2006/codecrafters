import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { courseService } from '../../services';
// import { courseService, adminService } from '../../services';
import CourseCard from '../../components/cards/CourseCard';
import { SkeletonCard, Pagination, EmptyState } from '../../components/ui/index.jsx';
import { FiBook } from 'react-icons/fi';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all_levels'];

const CoursesPage = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const page = Number(params.get('page') || 1);

  const filters = {
    page, limit: 12,
    search: params.get('search') || undefined,
    category: params.get('category') || undefined,
    level: params.get('level') || undefined,
    minPrice: params.get('minPrice') || undefined,
    maxPrice: params.get('maxPrice') || undefined,
    sort: params.get('sort') || '-createdAt',
  };

  const { data, isLoading } = useQuery(['courses', filters], () => courseService.getAll(filters), { keepPreviousData: true });
  // const { data: catData } = useQuery('categories', adminService.getCategories);
  const { data: catData } = useQuery('categories', courseService.getCategories);
  
  const courses = data?.data?.data || [];
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

  const hasFilters = params.get('search') || params.get('category') || params.get('level');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-200 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Explore All Courses</h1>
          <p className="text-gray-300 mb-8">200+ industry-relevant courses taught by top professionals</p>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
            </div>
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          {/* Category filter */}
          <select value={params.get('category') || ''} onChange={e => setFilter('category', e.target.value)}
            className="input w-auto py-2 text-sm">
            <option value="">All Categories</option>
            {categories.filter(c => c.type === 'course' || c.type === 'general').map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Level filter */}
          <select value={params.get('level') || ''} onChange={e => setFilter('level', e.target.value)}
            className="input w-auto py-2 text-sm">
            <option value="">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
          </select>

          {/* Sort */}
          <select value={params.get('sort') || '-createdAt'} onChange={e => setFilter('sort', e.target.value)}
            className="input w-auto py-2 text-sm">
            <option value="-createdAt">Newest</option>
            <option value="-enrollmentCount">Most Popular</option>
            <option value="-rating">Top Rated</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
              <FiX size={14} /> Clear filters
            </button>
          )}

          <p className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {pagination.total || 0} courses found
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SkeletonCard count={12} />
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(course => <CourseCard key={course._id} course={course} />)}
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={p => setFilter('page', p)} />
          </>
        ) : (
          <EmptyState icon={FiBook} title="No Courses Found" description="Try adjusting your search or filters." action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>} />
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
