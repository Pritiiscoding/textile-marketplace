import { useEffect, useState } from "react";
import {
  adminGetUsersRequest,
  adminUpdateUserRequest,
  adminDeleteUserRequest,
} from "../../api/adminApi";

const ROLE_BADGE = {
  buyer: "bg-blue-100 text-blue-700",
  supplier: "bg-green-100 text-green-700",
  admin: "bg-red-100 text-red-700",
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await adminGetUsersRequest({ search, role, limit: 100 });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, role]);

  const handleToggleActive = async (user) => {
    try {
      const { data } = await adminUpdateUserRequest(user._id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? data.user : u)));
    } catch {
      alert("Failed to update user");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await adminDeleteUserRequest(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">Users <span className="ml-1 text-sm font-normal text-gray-400">({total})</span></h2>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search email or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="buyer">Buyer</option>
          <option value="supplier">Supplier</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-responsive">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-brand-700">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Onboarded</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className={!u.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-2 text-brand-900">{u.email}</td>
                  <td className="px-4 py-2 text-gray-600">{u.profile?.companyName || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{u.onboardingCompleted ? "✓" : "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${u.isActive ? "text-green-600" : "text-red-500"}`}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.role !== "admin" && (
                      <>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="mr-3 text-brand-600 hover:underline"
                        >
                          {u.isActive ? "Suspend" : "Restore"}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{users.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
