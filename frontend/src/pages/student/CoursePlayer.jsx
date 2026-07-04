import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiChevronDown, FiChevronRight, FiList, FiX, FiDownload, FiExternalLink, FiBook } from 'react-icons/fi';
import { courseService } from '../../services';
import { Spinner, ProgressBar } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const CoursePlayer = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [tab, setTab] = useState('overview');
  const iframeRef = useRef(null);

  const { data, isLoading } = useQuery(['course-content', id], () => courseService.getCourseContent(id));
  const course = data?.data?.data?.course;
  const enrollment = data?.data?.data?.enrollment;

  const progressMutation = useMutation(
    (data) => courseService.updateProgress(id, data),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(['course-content', id]);
        if (res.data.data?.completed) {
          toast.success('🎉 Course completed! Your certificate is being generated.');
        }
      },
    }
  );

  useEffect(() => {
    if (course?.modules?.length && !activeLesson) {
      const firstModule = course.modules[0];
      const firstLesson = firstModule?.lessons?.[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
        setActiveModule(firstModule);
        setExpandedModules({ [firstModule._id]: true });
      }
    }
  }, [course]);

  const isLessonCompleted = (lessonId) => {
    return enrollment?.lessonProgress?.find(p => p.lessonId === lessonId)?.completed;
  };

  const markComplete = () => {
    if (!activeLesson || !activeModule) return;
    progressMutation.mutate({
      lessonId: activeLesson._id,
      moduleId: activeModule._id,
      completed: true,
    });
  };

  const selectLesson = (lesson, module) => {
    setActiveLesson(lesson);
    setActiveModule(module);
  };

  const downloadNotes = async () => {
    if (!activeLesson?.notesUrl) return;
    try {
      const response = await fetch(activeLesson.notesUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeLesson.title?.replace(/\s+/g, '_') || 'lesson'}-notes.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(activeLesson.notesUrl, '_blank', 'noopener noreferrer');
    }
  };

  // Convert MEGA link to embeddable (MEGA doesn't embed; show a redirect link)
  const getVideoEmbed = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
      return id ? `https://www.youtube.com/embed/${id[1]}?autoplay=1` : null;
    }
    return null; // MEGA links open in new tab
  };

  if (isLoading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-xl font-bold mb-2">Course not found or not enrolled</p>
        <Link to="/courses" className="btn-primary">Browse Courses</Link>
      </div>
    </div>
  );

  const totalLessons = course.modules?.reduce((a, m) => a + m.lessons?.length, 0) || 0;
  const embedUrl = activeLesson ? getVideoEmbed(activeLesson.videoUrl) : null;

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/* Header */}
      <header className="h-14 bg-dark-100 border-b border-dark-300 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-dark-300 transition-all text-gray-400 hover:text-white">
            <FiList size={18} />
          </button>
          <Link to="/dashboard/courses" className="text-sm text-gray-400 hover:text-white transition-colors">← My Courses</Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm font-medium text-white line-clamp-1 max-w-xs">{course.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{enrollment?.progress || 0}% complete</span>
          <div className="w-32 bg-dark-300 rounded-full h-1.5">
            <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${enrollment?.progress || 0}%` }} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-dark-100 border-r border-dark-300 overflow-y-auto flex-shrink-0 no-scrollbar">
              <div className="p-4 border-b border-dark-300">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Course Content</p>
                <p className="text-xs text-gray-500 mt-1">{totalLessons} lessons</p>
              </div>
              <div className="p-2">
                {course.modules?.map((module) => (
                  <div key={module._id} className="mb-1">
                    <button
                      onClick={() => setExpandedModules(p => ({ ...p, [module._id]: !p[module._id] }))}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-dark-300 transition-all text-left"
                    >
                      {expandedModules[module._id] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                      <span className="text-sm font-medium text-gray-200 flex-1">{module.title}</span>
                      <span className="text-xs text-gray-500">{module.lessons?.length}</span>
                    </button>

                    {expandedModules[module._id] && (
                      <div className="ml-4 space-y-0.5">
                        {module.lessons?.map((lesson) => {
                          const completed = isLessonCompleted(lesson._id);
                          const isActive = activeLesson?._id === lesson._id;
                          return (
                            <button key={lesson._id}
                              onClick={() => selectLesson(lesson, module)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                                isActive ? 'bg-primary-600 text-white' : 'hover:bg-dark-300 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs border ${
                                completed ? 'bg-green-500 border-green-500 text-white' :
                                isActive ? 'border-white text-white' : 'border-gray-600'
                              }`}>
                                {completed ? <FiCheck size={10} /> : '▶'}
                              </div>
                              <span className="text-xs leading-tight line-clamp-2 flex-1">{lesson.title}</span>
                              {lesson.videoDuration && (
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {Math.floor(lesson.videoDuration / 60)}m
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Video Area */}
          <div className="bg-black aspect-video w-full flex-shrink-0 relative">
            {activeLesson?.videoUrl ? (
              embedUrl ? (
                <iframe ref={iframeRef} src={embedUrl} className="w-full h-full" allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4">
                  <p className="text-lg font-semibold">{activeLesson.title}</p>
                  <p className="text-gray-400 text-sm">This video is hosted on MEGA</p>
                  <a href={activeLesson.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-2">
                    <FiExternalLink size={16} /> Open Video in MEGA
                  </a>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FiBook size={48} className="mx-auto mb-3 opacity-40" />
                  <p>Select a lesson to start watching</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson info & tabs */}
          <div className="flex-1 overflow-y-auto bg-dark-200">
            {activeLesson && (
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{activeLesson.title}</h2>
                    {activeLesson.videoDescription && (
                      <p className="text-gray-400 text-sm">{activeLesson.videoDescription}</p>
                    )}
                  </div>
                  <button onClick={markComplete} disabled={isLessonCompleted(activeLesson._id) || progressMutation.isLoading}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                      isLessonCompleted(activeLesson._id)
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}>
                    {progressMutation.isLoading ? <Spinner size="sm" /> : <FiCheck size={15} />}
                    {isLessonCompleted(activeLesson._id) ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-dark-300">
                  {['overview', 'notes', 'resources'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-all -mb-px ${
                        tab === t ? 'text-primary-400 border-primary-400' : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {activeLesson.description || 'No description available for this lesson.'}
                  </div>
                )}

                {tab === 'notes' && (
                  <div>
                    {activeLesson.notesUrl ? (
                      <div className="card bg-dark-300 p-4 flex items-center justify-between">
                        <span className="text-sm text-gray-300">📄 Lesson Notes PDF</span>
                        <button onClick={downloadNotes}
                          className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                          <FiDownload size={14} /> Download
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No notes for this lesson.</p>
                    )}
                    {activeLesson.notes && (
                      <div className="mt-4 text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none">
                        {activeLesson.notes}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'resources' && (
                  <div className="space-y-3">
                    {activeLesson.resources?.length > 0 ? activeLesson.resources.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-dark-300 rounded-xl hover:bg-dark-100 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{r.type === 'pdf' ? '📄' : r.type === 'link' ? '🔗' : '📁'}</span>
                          <span className="text-sm text-gray-200 group-hover:text-white transition-colors">{r.title}</span>
                        </div>
                        <FiExternalLink size={14} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
                      </a>
                    )) : (
                      <p className="text-gray-500 text-sm">No resources for this lesson.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoursePlayer;
