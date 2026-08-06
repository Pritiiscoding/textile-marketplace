import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const SocketContext = createContext();

// Helper: dispatch a custom window event so any page can listen and auto-refresh
const dispatchPageEvent = (eventName, detail = {}) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const addNotif = (prev, notif) => [{ ...notif, read: false, time: new Date() }, ...prev].slice(0, 50);

const saveTo = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

const loadFrom = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const SocketProvider = ({ user, children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState(() => loadFrom("tl_notifications"));

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    saveTo("tl_notifications", notifications);
  }, [notifications]);

  useEffect(() => {
    if (!user) return;

    const rawUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socketUrl = rawUrl.replace(/\/api\/?$/, "");

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("join", user._id || user.id);
    });

    newSocket.on("order_status_updated", (data) => {
      toast.success(data.message, { duration: 6000, icon: "📦", style: { background: "#1e293b", color: "#fff", border: "1px solid #3b6cf7" } });
      const link = user.role === "buyer" ? `/buyer/orders/${data.orderId}` : `/supplier/orders/${data.orderId}`;
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "Order Update", message: data.message, link }));
      dispatchPageEvent("tl:order_status_updated", data);
    });

    newSocket.on("new_order", (data) => {
      toast.success(data.message, { duration: 6000, icon: "🎉", style: { background: "#1e293b", color: "#fff", border: "1px solid #10b981" } });
      const link = `/supplier/orders/${data.orderId}`;
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "New Order", message: data.message, link }));
      dispatchPageEvent("tl:new_order", data);
    });

    newSocket.on("new_rfq", (data) => {
      toast.success(data.message, { duration: 8000, icon: "📋", style: { background: "#1e293b", color: "#fff", border: "1px solid #6366f1" } });
      const link = user.role === "supplier" ? "/supplier/negotiations" : "/buyer/negotiations";
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "New RFQ Inquiry", message: data.message, link }));
      dispatchPageEvent("tl:new_rfq", data);
    });

    newSocket.on("new_negotiation", (data) => {
      toast.success(data.message, { duration: 8000, icon: "💬", style: { background: "#1e293b", color: "#fff", border: "1px solid #10b981" } });
      const link = user.role === "supplier" ? "/supplier/negotiations" : "/buyer/negotiations";
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "New Price Offer", message: data.message, link }));
      dispatchPageEvent("tl:new_negotiation", data);
    });

    newSocket.on("negotiation_updated", (data) => {
      toast.info(data.message, { icon: "🔄", duration: 6000, style: { background: "#1e293b", color: "#fff", border: "1px solid #6366f1" } });
      const link = user.role === "supplier" ? "/supplier/negotiations" : "/buyer/negotiations";
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "Negotiation Updated", message: data.message, link }));
      dispatchPageEvent("tl:negotiation_updated", data);
    });

    newSocket.on("rfq_updated", (data) => {
      toast.success(data.message, { icon: "📋", duration: 8000, style: { background: "#1e293b", color: "#fff", border: "1px solid #10b981" } });
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "RFQ Quote Received", message: data.message, link: "/buyer/negotiations" }));
      dispatchPageEvent("tl:rfq_updated", data);
    });

    newSocket.on("product_updated", (data) => {
      toast.success(data.message, { icon: "🔄", duration: 5000, style: { background: "#1e293b", color: "#fff", border: "1px solid #6366f1" } });
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "Product Updated", message: data.message, link: user.role === "supplier" ? "/supplier/inventory" : "/buyer" }));
      dispatchPageEvent("tl:product_updated", data);
    });

    newSocket.on("new_product", (data) => {
      toast.success(data.message, { icon: "✨", duration: 6000, style: { background: "#1e293b", color: "#fff", border: "1px solid #10b981" } });
      setNotifications((prev) => addNotif(prev, { id: Date.now(), title: "New Product Added", message: data.message, link: "/buyer" }));
      dispatchPageEvent("tl:new_product", data);
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    try { localStorage.removeItem("tl_notifications"); } catch {}
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, dispatchPageEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
