import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiStar } from 'react-icons/fi';
import { Spinner } from '../../components/ui/index.jsx';
import api from '../../services/api';

const fetchLeaderboard = () => api.get('/users/leaderboard').catch(() => ({ data: { data: [] } }));

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const { user } = useSelector(s => s.auth);
  // Backend leaderboard endpoint doesn't exist yet — we show a placeholder
  // that still renders correctly while being honest about data availability.
  const { data, isLoading } = useQuery('leaderboard', fetchLeaderboard);
  const entries = data?.data?.data || [];

  const mockEntries = [
    { rank: 1, name: 'Aditya Kumar', points: 4850, certificates: 7, courses: 12 },
    { rank: 2, name: 'Priya Singh', points: 4620, certificates: 6, courses: 11 },
    { rank: 3, name: 'Rohit Sharma', points: 4310, certificates: 5, courses: 10 },
    { rank: 4, name: 'Sneha Patel', points: 3980, certificates: 5, courses: 9 },
    { rank: 5, name: 'Arjun Mehta', points: 3750, certificates: 4, courses: 8 },
  ];

  const display = entries.length > 0 ? entries : mockEntries;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <FiTrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Top students on the platform</p>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          Live leaderboard coming soon. Showing sample data.
        </div>
      )}

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {display.slice(0, 3).map((entry, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`card p-5 text-center ${i === 0 ? 'ring-2 ring-yellow-400 shadow-glow' : ''}`}>
            <div className="text-4xl mb-2">{MEDALS[i]}</div>
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 font-black text-lg flex items-center justify-center mx-auto mb-2">
              {entry.name.charAt(0)}
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{entry.name}</p>
            <p className="text-2xl font-black text-primary-600 mt-1">{entry.points?.toLocaleString()}</p>
            <p className="text-xs text-gray-500">points</p>
            <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><FiAward size={11} /> {entry.certificates}</span>
              <span className="flex items-center gap-1"><FiStar size={11} /> {entry.courses}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                {['Rank', 'Student', 'Points', 'Certificates', 'Courses'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
              {display.map((entry, i) => (
                <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors ${entry.name === `${user?.firstName} ${user?.lastName}` ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                  <td className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
                    {i < 3 ? MEDALS[i] : `#${entry.rank || i + 1}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {entry.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{entry.name}</span>
                      {entry.name === `${user?.firstName} ${user?.lastName}` && (
                        <span className="badge-primary text-xs">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary-600">{entry.points?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.certificates}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.courses}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
