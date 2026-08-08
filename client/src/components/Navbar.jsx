import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import BulbToggle from "./BulbToggle";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();
  const { notifications, unreadCount, clearNotifications, markAllAsRead, markAsRead: markNotificationAsRead } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu & notification dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
    setShowNotifMenu(false);
  }, [location.pathname]);

  // Click outside to close notification tab automatically
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all notifications as read when notification menu is opened
  useEffect(() => {
    if (showNotifMenu && unreadCount > 0) {
      markAllAsRead();
    }
  }, [showNotifMenu, unreadCount, markAllAsRead]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const logoDestination = "/";
  const displayName = user?.profile?.companyName || user?.email?.split("@")[0] || "";

  const getNavLinks = () => {
    if (!isAuthenticated || !user) return [];

    if (user.role === "supplier" && user.onboardingCompleted) {
      return [
        { to: "/supplier", label: "Dashboard" },
        { to: "/supplier/inventory", label: "Inventory" },
        { to: "/supplier/orders", label: "Orders" },
        { to: "/supplier/negotiations", label: "RFQs & Offers" },
      ];
    }

    if (user.role === "buyer" && user.onboardingCompleted) {
      return [
        { to: "/buyer", label: "Marketplace" },
        { to: "/buyer/orders", label: "Orders" },
        { to: "/buyer/negotiations", label: "RFQs & Offers" },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/30"
          : "bg-slate-900 dark:bg-slate-950 border-b border-slate-800"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to={logoDestination} className="flex items-center gap-3 group mr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 text-white text-lg font-bold shadow-lg transition-transform group-hover:scale-110 group-hover:shadow-xl" style={{ boxShadow: '0 4px 15px rgba(59, 108, 247, 0.4)' }}>
            🧵
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Thread<span className="text-gradient-brand">Loom</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2.5 sm:flex">
          {isAuthenticated ? (
            <>
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/supplier" || to === "/buyer"}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "text-white bg-white/15 shadow-sm"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}

              {user.role === "buyer" && user.onboardingCompleted && (
                <NavLink
                  to="/buyer/cart"
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      isActive ? "text-white bg-white/15" : "text-white/70 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  Cart
                  {itemCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-[9px] font-bold text-white shadow-sm">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </NavLink>
              )}

              {/* Feature 1: Live Clickable WebSocket Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-3 z-50 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700 font-semibold text-white">
                      <span>Live Notifications</span>
                      <button onClick={clearNotifications} className="text-brand-400 hover:underline text-[10px]">
                        Clear
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-center py-3">No new notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifMenu(false);
                            }}
                            className={`p-2.5 rounded-lg cursor-pointer transition border ${
                              !n.read 
                                ? "bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600/50 hover:border-brand-500 border-l-4 border-l-brand-500" 
                                : "bg-slate-800/40 hover:bg-slate-800/60 text-slate-400 border-slate-700/50 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`font-bold block ${!n.read ? 'text-brand-400' : 'text-slate-400'}`}>{n.title}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">View Details →</span>
                            </div>
                            <span className={`block mt-0.5 ${!n.read ? 'text-slate-300' : 'text-slate-500'}`}>{n.message}</span>
                            {n.time && (
                              <span className="text-[9px] text-slate-500 mt-1 block">
                                {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature 9: Day/Night Mode Light Bulb Toggle */}
              <BulbToggle />

              <div className="mx-1 h-5 w-px bg-white/15" />

              <Link
                to={user.role === "supplier" ? "/supplier/profile" : "/buyer/profile"}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 border border-white/10 hover:bg-white/20 hover:text-white transition"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-[10px] font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-xs font-medium">{displayName}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-white/20 bg-white/8 px-3.5 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <BulbToggle className="mr-2" />
              <Link to="/login" className="rounded-lg px-4 py-1.5 text-sm font-medium text-white/80 hover:text-white">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2">
                Get Started
              </Link>
            </>
          )}
        </div>


        {/* Mobile menu icon */}
        <button
          className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
