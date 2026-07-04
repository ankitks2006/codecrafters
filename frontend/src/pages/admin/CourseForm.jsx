import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import {
  FiUpload, FiPlus, FiTrash2, FiChevronDown, FiChevronRight,
  FiSave, FiArrowLeft, FiVideo, FiFileText, FiX,
} from 'react-icons/fi';
import { courseService, adminService } from '../../services';
import { Spinner } from '../../components/ui/index.jsx';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all_levels'];

const AdminCourseForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const thumbRef = useRef();
  const [thumbPreview, setThumbPreview] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState(id || null);
  const [modules, setModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '', shortDescription: '', description: '', category: '',
      level: 'beginner', language: 'English', price: 0, discountPrice: 0,
      duration: 0, isPublished: false, hasCertificate: true,
    },
  });

  const { data: catData } = useQuery('admin-categories', adminService.getCategories);
  const categories = catData?.data?.data || [];

  // Load existing course when editing
  const { isLoading: loadingCourse } = useQuery(
    ['admin-course-edit', id],
    () => courseService.getForAdmin(id),
    {
      enabled: isEdit,
      onSuccess: (res) => populateForm(res.data.data),
      onError: () => toast.error('Could not load course for editing'),
    }
  );

  const populateForm = (course) => {
    reset({
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      category: course.category?._id || course.category,
      level: course.level,
      language: course.language,
      price: course.price,
      discountPrice: course.discountPrice,
      duration: course.duration,
      isPublished: course.isPublished,
      hasCertificate: course.hasCertificate,
    });
    setThumbPreview(course.thumbnail);
    setModules(course.modules || []);
    setCourseId(course._id);
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  // Step 1: Save course basic info (create or update)
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => formData.append(key, val));
      if (thumbFile) formData.append('thumbnail', thumbFile);

      let res;
      if (courseId) {
        res = await courseService.update(courseId, formData);
        toast.success('Course updated successfully');
      } else {
        res = await courseService.create(formData);
        toast.success('Course created! Now add modules and lessons below.');
        setCourseId(res.data.data._id);
        navigate(`/admin/courses/${res.data.data._id}/edit`, { replace: true });
      }
    } catch {
      // error toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Add a module (only once course exists)
  const handleAddModule = async () => {
    if (!courseId) { toast.error('Save the course details first'); return; }
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      const res = await courseService.addModule(courseId, { title: newModuleTitle, description: '' });
      setModules(prev => [...prev, res.data.data]);
      setNewModuleTitle('');
      setExpandedModule(res.data.data._id);
      toast.success('Module added');
    } catch {} finally { setAddingModule(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link to="/admin/courses" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 text-gray-500 transition-all">
          <FiArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{isEdit ? 'Edit Course' : 'Add New Course'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {courseId ? 'Update details, then manage modules & lessons below' : 'Step 1: Fill in basic details to create the course'}
          </p>
        </div>
      </div>

      {loadingCourse && <div className="flex justify-center py-10"><Spinner size="lg" /></div>}

      {/* ── Course Basic Info ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <h2 className="font-bold text-gray-900 dark:text-white">Course Details</h2>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thumbnail Image</label>
          <div className="flex items-center gap-4">
            <div onClick={() => thumbRef.current?.click()}
              className="w-32 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary-400 transition-all flex-shrink-0">
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiUpload className="text-gray-400" size={20} />
              )}
            </div>
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            <p className="text-xs text-gray-400">Recommended: 800x450px, JPG/PNG, max 5MB</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course Title</label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="e.g. Complete React.js Bootcamp" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Short Description</label>
          <input {...register('shortDescription', { required: 'Required', maxLength: { value: 300, message: 'Max 300 characters' } })}
            className="input" placeholder="One-line summary shown on course cards" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Description</label>
          <textarea {...register('description', { required: 'Required' })} rows={5} className="input resize-none"
            placeholder="Detailed course description..." />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
            <select {...register('category', { required: 'Required' })} className="input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
            <select {...register('level')} className="input">
              {LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹)</label>
            <input {...register('price', { required: true, min: 0 })} type="number" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount Price (₹)</label>
            <input {...register('discountPrice', { min: 0 })} type="number" className="input" placeholder="0 = no discount" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (hours)</label>
            <input {...register('duration', { required: true, min: 0 })} type="number" className="input" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input {...register('hasCertificate')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" />
            Issue Certificate
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input {...register('isPublished')} type="checkbox" className="w-4 h-4 rounded accent-primary-500" />
            Published (visible to students)
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <><Spinner size="sm" /> Saving...</> : <><FiSave size={16} /> {courseId ? 'Update Details' : 'Create Course & Continue'}</>}
        </button>
      </form>

      {/* ── Modules & Lessons (only once course exists) ── */}
      {courseId ? (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Curriculum — Modules & Lessons</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add modules, then add video lessons inside each. Paste a <strong>MEGA</strong> share link (or YouTube link) as the video URL — videos are never uploaded to this server.
          </p>

          {/* Add module */}
          <div className="flex gap-2">
            <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddModule())}
              placeholder="New module title, e.g. 'Module 1: Getting Started'" className="input flex-1 py-2.5" />
            <button onClick={handleAddModule} disabled={addingModule || !newModuleTitle.trim()}
              className="btn-primary px-4 flex items-center gap-1.5 text-sm">
              {addingModule ? <Spinner size="sm" /> : <><FiPlus size={15} /> Add Module</>}
            </button>
          </div>

          {/* Modules list */}
          <div className="space-y-3">
            {modules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No modules yet. Add your first module above.</p>
            ) : (
              modules.map((mod) => (
                <ModuleBlock
                  key={mod._id}
                  courseId={courseId}
                  module={mod}
                  expanded={expandedModule === mod._id}
                  onToggle={() => setExpandedModule(expandedModule === mod._id ? null : mod._id)}
                  onLessonAdded={(lesson) => {
                    setModules(prev => prev.map(m => m._id === mod._id ? { ...m, lessons: [...(m.lessons || []), lesson] } : m));
                  }}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center text-gray-400 text-sm">
          Save the course details above first — modules and lessons can be added once the course is created.
        </div>
      )}
    </div>
  );
};

// ── Sub-component: one module with its lesson list + add-lesson form ──
const ModuleBlock = ({ courseId, module, expanded, onToggle, onLessonAdded }) => {
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const notesRef = useRef();
  const [notesFile, setNotesFile] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', videoUrl: '', videoDuration: '', isFree: false },
  });

  const onAddLesson = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => formData.append(key, val));
      if (notesFile) formData.append('notes', notesFile);

      const res = await courseService.addLesson(courseId, module._id, formData);
      onLessonAdded(res.data.data);
      toast.success('Lesson added');
      reset();
      setNotesFile(null);
      setShowLessonForm(false);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="border border-gray-200 dark:border-dark-300 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-dark-300 transition-all text-left">
        <div className="flex items-center gap-2">
          {expanded ? <FiChevronDown size={15} /> : <FiChevronRight size={15} />}
          <span className="font-medium text-sm text-gray-900 dark:text-white">{module.title}</span>
        </div>
        <span className="text-xs text-gray-500">{module.lessons?.length || 0} lessons</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-dark-300 p-4 space-y-3 bg-gray-50/50 dark:bg-dark-300/30">
          {/* Existing lessons */}
          {module.lessons?.map((lesson, i) => (
            <div key={lesson._id || i} className="flex items-center gap-2.5 bg-white dark:bg-dark-200 px-3 py-2 rounded-lg text-sm">
              <FiVideo size={14} className="text-primary-500 flex-shrink-0" />
              <span className="flex-1 text-gray-800 dark:text-gray-200">{lesson.title}</span>
              {lesson.isFree && <span className="badge-primary text-xs">Free Preview</span>}
            </div>
          ))}

          {/* Add lesson form */}
          {showLessonForm ? (
            <form onSubmit={handleSubmit(onAddLesson)} className="bg-white dark:bg-dark-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">New Lesson</p>
                <button type="button" onClick={() => setShowLessonForm(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX size={16} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Lesson Title</label>
                <input {...register('title', { required: true })} className="input py-2 text-sm" placeholder="e.g. Introduction to Hooks" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Video URL (MEGA link or YouTube)
                </label>
                <input {...register('videoUrl', { required: true })} className="input py-2 text-sm" placeholder="https://mega.nz/file/xxxxx or https://youtube.com/watch?v=xxxxx" />
                <p className="text-xs text-gray-400 mt-1">Upload the video file to MEGA first, then paste the share link here. Videos are never stored on our servers.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duration (seconds)</label>
                  <input {...register('videoDuration')} type="number" className="input py-2 text-sm" placeholder="600" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <input {...register('isFree')} type="checkbox" className="w-3.5 h-3.5 rounded accent-primary-500" />
                    Free preview lesson
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes PDF (optional)</label>
                <div onClick={() => notesRef.current?.click()}
                  className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-dark-300 rounded-lg px-3 py-2 cursor-pointer hover:border-primary-400 transition-all text-sm text-gray-500">
                  <FiFileText size={14} />
                  {notesFile ? notesFile.name : 'Click to upload PDF notes'}
                </div>
                <input ref={notesRef} type="file" accept=".pdf" className="hidden" onChange={e => setNotesFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-1.5">
                {saving ? <Spinner size="sm" /> : <FiPlus size={14} />} Add Lesson
              </button>
            </form>
          ) : (
            <button onClick={() => setShowLessonForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-gray-300 dark:border-dark-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-all">
              <FiPlus size={14} /> Add Lesson
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCourseForm;
