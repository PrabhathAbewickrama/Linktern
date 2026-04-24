import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";

const formatNotificationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const hasNotifications = items.length > 0;

  const visibleUnreadCount = useMemo(() => {
    if (unreadCount > 99) return "99+";
    return unreadCount;
  }, [unreadCount]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      setItems(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  };

  const markOneAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setItems((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notification-toggle"
        onClick={handleToggle}
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{visibleUnreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount} unread</p>
            </div>
            <button
              type="button"
              className="notification-mark-all"
              onClick={markAllAsRead}
              disabled={!hasNotifications || unreadCount === 0}
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Loading notifications...</div>
            ) : !hasNotifications ? (
              <div className="notification-empty">
                No notifications yet. New updates will appear here.
              </div>
            ) : (
              items.map((item) => {
                const content = (
                  <>
                    <div className="notification-item-top">
                      <span className="notification-item-title">{item.title}</span>
                      {!item.isRead && <span className="notification-unread-dot" />}
                    </div>
                    <p className="notification-item-message">{item.message}</p>
                    <span className="notification-item-time">
                      {formatNotificationTime(item.createdAt)}
                    </span>
                  </>
                );

                return (
                  <div
                    key={item._id}
                    className={`notification-item ${item.isRead ? "read" : "unread"}`}
                  >
                    {item.link ? (
                      <Link
                        to={item.link}
                        className="notification-item-link"
                        onClick={() => {
                          if (!item.isRead) {
                            markOneAsRead(item._id);
                          }
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="notification-item-link notification-item-button"
                        onClick={() => {
                          if (!item.isRead) {
                            markOneAsRead(item._id);
                          }
                        }}
                      >
                        {content}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
