import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { FiSearch, FiSlash, FiCheckCircle, FiUsers, FiMail } from 'react-icons/fi';
import { adminService } from '../../services';
import { Pagination, EmptyState, Spinner, Modal, ConfirmDialog } from '../../components/ui/index.jsx';

const ROLES = ['student', 'trainer', 'hr', 'admin'];

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [blockTarget, setBlockTarget] = useState(null);
  const [blocking, setBlocking] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  const { data, isLoading } = useQuery(
    ['admin-users', page, search, role],
    () => adminService.getUsers({ page, limit: 15, search: search || undefined, role: role || undefined }),
    { keepPreviousData: true }
  );
  const users = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleBlockToggle = async () => {
    if (!blockTarget) return;
    setBlocking(true);
    try {
      await adminService.toggleUserBlock(blockTarget._id);
      toast.success(blockTarget.isBlocked ? 'User unblocked' : 'User blocked');
      queryClient.invalidateQueries(['admin-users']);
      setBlockTarget(null);
    } catch {} finally { setBlocking(false); }
  };

  const openRoleChange = (user) => {
    setRoleTarget(user);
    setNewRole(user.role);
  };

  const handleRoleChange = async () => {
    if (!roleTarget || newRole === roleTarget.role) { setRoleTarget(null); return; }
    setChangingRole(true);
    try {
      await adminService.changeUserRole(roleTarget._id, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      queryClient.invalidateQueries(['admin-users']);
      setRoleTarget(null);
    } catch {} finally { setChangingRole(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Manage Users</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{pagination.total || 0} users total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..." className="input pl-10 py-2.5 text-sm" />
        </form>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="input w-auto py-2.5 text-sm">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          <option value="super_admin">super_admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : users.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-300 bg-gray-50 dark:bg-dark-300">
                    {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-300">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=6C63FF&color=fff`}
                            alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><FiMail size={11} /> {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openRoleChange(u)} disabled={u.role === 'super_admin'}
                          className="badge-primary text-xs capitalize hover:opacity-80 transition-opacity disabled:opacity-100 disabled:cursor-default">
                          {u.role.replace('_', ' ')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className={`badge text-xs ${u.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                            {u.isEmailVerified ? 'Verified' : 'Unverified'}
                          </span>
                          {u.isBlocked && <span className="badge-danger text-xs">Blocked</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'super_admin' && (
                          <button onClick={() => setBlockTarget(u)}
                            className={`p-2 rounded-lg transition-all ${u.isBlocked ? 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'}`}
                            title={u.isBlocked ? 'Unblock user' : 'Block user'}>
                            {u.isBlocked ? <FiCheckCircle size={15} /> : <FiSlash size={15} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={FiUsers} title="No users found" description="Try adjusting your search or filters" />
      )}

      <ConfirmDialog
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlockToggle}
        title={blockTarget?.isBlocked ? 'Unblock User' : 'Block User'}
        message={blockTarget?.isBlocked
          ? `Unblock ${blockTarget?.firstName} ${blockTarget?.lastName}? They will regain access to their account.`
          : `Block ${blockTarget?.firstName} ${blockTarget?.lastName}? They will be unable to log in or access the platform.`}
        confirmText={blockTarget?.isBlocked ? 'Unblock' : 'Block'}
        danger={!blockTarget?.isBlocked}
        loading={blocking}
      />

      <Modal isOpen={!!roleTarget} onClose={() => setRoleTarget(null)} title="Change User Role" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Update role for <strong>{roleTarget?.firstName} {roleTarget?.lastName}</strong>
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
            Note: role changes require super admin privileges on the server. This action will fail if your account is not a super admin.
          </p>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRoleTarget(null)} className="btn-secondary" disabled={changingRole}>Cancel</button>
            <button onClick={handleRoleChange} disabled={changingRole} className="btn-primary flex items-center gap-2">
              {changingRole ? <Spinner size="sm" /> : null} Update Role
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
