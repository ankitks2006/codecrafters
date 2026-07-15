import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import {
  FiUpload, FiSave, FiArrowLeft,
} from 'react-icons/fi';
import { blogService, adminService } from '../../services';
import { Spinner } from '../../components/ui/index.jsx';

const AdminBlogForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const thumbRef = useRef();
  const [thumbPreview, setThumbPreview] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [blogId, setBlogId] = useState(id || null);
  const [tagsInput, setTagsInput] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      category: '',
      status: 'draft',
      isFeatured: false,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
    },
  });

  const { data: catData } = useQuery('admin-categories', adminService.getCategories);
  const categories = (catData?.data?.data || []).filter(c => c.type === 'blog');

  const { isLoading: loadingBlog } = useQuery(
    ['admin-blog-edit', id],
    () => blogService.getForAdmin(id),
    {
      enabled: isEdit,
      onSuccess: (res) => populateForm(res.data.data),
      onError: () => toast.error('Could not load blog for editing'),
    }
  );

  const populateForm = (blog) => {
    reset({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      category: blog.category?._id || blog.category || '',
      status: blog.status || 'draft',
      isFeatured: blog.isFeatured || false,
      metaTitle: blog.meta?.title || '',
      metaDescription: blog.meta?.description || '',
      metaKeywords: blog.meta?.keywords?.join(', ') || '',
    });
    setThumbPreview(blog.thumbnail);
    setTagsInput((blog.tags || []).join(', '));
    setBlogId(blog._id);
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('excerpt', data.excerpt);
      if (data.category) formData.append('category', data.category);
      formData.append('status', data.status);
      formData.append('isFeatured', data.isFeatured ? 'true' : 'false');
      formData.append('metaTitle', data.metaTitle);
      formData.append('metaDescription', data.metaDescription);
      formData.append('metaKeywords', data.metaKeywords);

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      tags.forEach(t => formData.append('tags', t));

      if (thumbFile) formData.append('thumbnail', thumbFile);

      let res;
      if (blogId) {
        res = await blogService.update(blogId, formData);
        toast.success('Blog updated successfully');
      } else {
        res = await blogService.create(formData);
        toast.success('Blog created!');
        setBlogId(res.data.data._id);
      }
      navigate('/admin/blogs');
    } catch {
      // error toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link to="/admin/blogs" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-500 transition-all">
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{isEdit ? 'Edit Blog Post' : 'Add New Blog Post'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {blogId ? 'Update your blog post details' : 'Fill in the details to create a new blog post'}
          </p>
        </div>
      </div>

      {loadingBlog && <div className="flex justify-center py-10"><Spinner size="lg" /></div>}

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <h2 className="font-bold text-gray-900 dark:text-white">Post Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thumbnail Image</label>
          <div className="flex items-center gap-4">
            <div onClick={() => thumbRef.current?.click()}
              className="w-40 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary-400 transition-all flex-shrink-0">
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiUpload className="text-gray-400" size={24} />
              )}
            </div>
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            <p className="text-xs text-gray-400">Recommended: 800x450px, JPG/PNG, max 5MB</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="e.g. How to Build a Full-Stack App" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content</label>
          <textarea {...register('content', { required: 'Content is required' })} rows={10} className="input resize-none" placeholder="Write your blog content here..." />
          {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Excerpt</label>
          <textarea {...register('excerpt')} rows={2} className="input resize-none" placeholder="Short summary shown on blog cards (max 300 chars)" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
            <select {...register('category')} className="input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select {...register('status')} className="input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            className="input"
            placeholder="react, javascript, web development (comma-separated)"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input {...register('isFeatured')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" />
            Featured Post
          </label>
        </div>

        <div className="border-t border-gray-100 dark:border-dark-300 pt-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">SEO Settings (optional)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Meta Title</label>
              <input {...register('metaTitle')} className="input" placeholder="SEO title for search engines" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Meta Description</label>
              <textarea {...register('metaDescription')} rows={2} className="input resize-none" placeholder="SEO description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Keywords</label>
              <input {...register('metaKeywords')} className="input" placeholder="keyword1, keyword2, keyword3" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/admin/blogs" className="btn-secondary flex items-center gap-2">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><Spinner size="sm" /> Saving...</> : <><FiSave size={16} /> {blogId ? 'Update Post' : 'Create Post'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminBlogForm;
