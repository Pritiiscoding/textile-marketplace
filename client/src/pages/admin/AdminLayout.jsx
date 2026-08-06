import { NavLink, Outlet } from "react-router-dom";

const tabClass = ({ isActive }) =>
  `border-b-2 px-1 py-3 text-sm font-medium transition ${
    isActive
      ? "border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-400"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-300"
  }`;

const AdminLayout = () => (
  <div className="mx-auto max-w-7xl px-4 min-h-screen">
    <div className="mb-2 flex items-center gap-3 pt-4">
      <span className="rounded bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
        ADMIN
      </span>
      <h1 className="text-lg font-semibold text-brand-900 dark:text-white">Admin Panel</h1>
    </div>
    <nav className="flex gap-4 overflow-x-auto border-b border-gray-200 dark:border-slate-800 scrollbar-none">
      <NavLink to="/admin" end className={tabClass}>Users</NavLink>
      <NavLink to="/admin/products" className={tabClass}>Products</NavLink>
      <NavLink to="/admin/orders" className={tabClass}>Orders</NavLink>
      <NavLink to="/admin/activity" className={tabClass}>Activity Log</NavLink>
    </nav>
    <div className="py-6">
      <Outlet />
    </div>
  </div>
);


export default AdminLayout;
