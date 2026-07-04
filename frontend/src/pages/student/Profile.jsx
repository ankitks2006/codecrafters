import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiCamera, FiSave, FiUser, FiMail, FiPhone, FiGithub, FiLinkedin, FiGlobe, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userService } from '../../services';
import { updateUser } from '../../redux/slices/authSlice';
import { Spinner } from '../../components/ui/index.jsx';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(user?.skills || []);
  const fileRef = useRef();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      'socialLinks.github': user?.socialLinks?.github || '',
      'socialLinks.linkedin': user?.socialLinks?.linkedin || '',
      'socialLinks.portfolio': user?.socialLinks?.portfolio || '',
      'address.city': user?.address?.city || '',
      'address.state': user?.address?.state || '',
      'address.country': user?.address?.country || 'India',
    }
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        bio: data.bio,
        skills,
        socialLinks: {
          github: data['socialLinks.github'],
          linkedin: data['socialLinks.linkedin'],
          portfolio: data['socialLinks.portfolio'],
        },
        address: {
          city: data['address.city'],
          state: data['address.state'],
          country: data['address.country'],
        },
      };
      const res = await userService.updateProfile(payload);
      dispatch(updateUser(res.data.data));
      toast.success('Profile updated successfully!');
    } catch {} finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; }
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await userService.uploadAvatar(formData);
      dispatch(updateUser({ avatar: res.data.data.avatar }));
      toast.success('Avatar updated!');
    } catch {} finally { setAvatarLoading(false); }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => setSkills(skills.filter(s => s !== skill));

  const InputField = ({ name, label, icon: Icon, type = 'text', placeholder, validation = {}, textarea = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
        {textarea ? (
          <textarea {...register(name, validation)} placeholder={placeholder} rows={4}
            className={`input resize-none ${Icon ? 'pl-10' : ''}`} />
        ) : (
          <input {...register(name, validation)} type={type} placeholder={placeholder}
            className={`input ${Icon ? 'pl-10' : ''}`} />
        )}
      </div>
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6C63FF&color=fff&size=100`}
                alt="Avatar" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary-200 dark:ring-primary-900/50"
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarLoading}
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-xl flex items-center justify-center shadow-lg transition-all">
                {avatarLoading ? <Spinner size="sm" /> : <FiCamera size={15} className="text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <span className="badge-primary text-xs mt-1 inline-block capitalize">{user?.role}</span>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField name="firstName" label="First Name" icon={FiUser} placeholder="First Name" validation={{ required: 'Required' }} />
            <InputField name="lastName" label="Last Name" icon={FiUser} placeholder="Last Name" validation={{ required: 'Required' }} />
          </div>
          <InputField name="phone" label="Phone Number" icon={FiPhone} placeholder="+91 9876543210" />
          <InputField name="bio" label="Bio" placeholder="Tell us about yourself..." textarea validation={{ maxLength: { value: 500, message: 'Max 500 chars' } }} />
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
          <div className="flex gap-2 mb-3">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add a skill (e.g. React, Python)" className="input flex-1 py-2.5" />
            <button type="button" onClick={addSkill} className="btn-primary px-4 py-2.5 flex items-center gap-1.5 text-sm">
              <FiPlus size={15} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill} className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full text-sm font-medium">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                  <FiX size={13} />
                </button>
              </span>
            ))}
            {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet</p>}
          </div>
        </div>

        {/* Social Links */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Social Links</h2>
          <InputField name="socialLinks.github" label="GitHub" icon={FiGithub} placeholder="https://github.com/username" />
          <InputField name="socialLinks.linkedin" label="LinkedIn" icon={FiLinkedin} placeholder="https://linkedin.com/in/username" />
          <InputField name="socialLinks.portfolio" label="Portfolio" icon={FiGlobe} placeholder="https://yourportfolio.com" />
        </div>

        {/* Address */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Address</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <InputField name="address.city" label="City" placeholder="City" />
            <InputField name="address.state" label="State" placeholder="State" />
            <InputField name="address.country" label="Country" placeholder="Country" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base">
          {saving ? <><Spinner size="sm" /> Saving...</> : <><FiSave size={18} /> Save Profile</>}
        </button>
      </form>
    </div>
  );
};

export default Profile;
