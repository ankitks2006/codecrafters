import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const footerLinks = {
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Career', to: '/career' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/contact' },
  ],
  Courses: [
    { label: 'All Courses', to: '/courses' },
    { label: 'Internships', to: '/internships' },
    { label: 'Projects', to: '/projects' },
    { label: 'Certificates', to: '/verify/demo' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms & Conditions', to: '/terms' },
    { label: 'Refund Policy', to: '/refund' },
    { label: 'FAQ', to: '/faq' },
  ],
};

const Footer = () => (
  <footer className="bg-dark-100 text-gray-300 border-t border-dark-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-white font-black">TSC</span>
            </div>
            <span className="font-bold text-xl text-white">The <span className="text-primary-400">Skill</span> Coder</span>
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
            India's premier internship & learning management platform. Build real skills, earn verified certificates, and launch your tech career.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FiMail size={14} className="text-primary-400" />
              <span>contact@theskillcoder.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FiPhone size={14} className="text-primary-400" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FiMapPin size={14} className="text-primary-400" />
              <span>Bangalore, Karnataka, India</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            {[
              { icon: FiGithub, href: 'https://github.com/theskillcoder' },
              { icon: FiLinkedin, href: 'https://linkedin.com/company/theskillcoder' },
              { icon: FiTwitter, href: 'https://twitter.com/theskillcoder' },
              { icon: FiInstagram, href: 'https://instagram.com/theskillcoder' },
            ].map(({ icon: Icon, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-dark-300 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group}>
            <h3 className="font-semibold text-white mb-4">{group}</h3>
            <ul className="space-y-2.5">
              {links.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-dark-300 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} TheSkillCoder. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Made with ❤️ in India</span>
          <Link to="/verify/demo" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            Verify Certificate
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
