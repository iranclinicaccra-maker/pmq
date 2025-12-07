import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    getUnreadNotifications,
    getAllNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../utils/notificationService';

const NotificationCenter = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, showAll]);

    const fetchNotifications = async () => {
        if (!user) return;

        const allNotifs = showAll
            ? await getAllNotifications(user.id)
            : await getUnreadNotifications(user.id);

        setNotifications(allNotifs);

        const unread = await getUnreadNotifications(user.id);
        setUnreadCount(unread.length);
    };

    const handleNotificationClick = async (notification) => {
        await markAsRead(notification.id);
        setIsOpen(false);

        if (notification.link) {
            navigate(notification.link);
        }

        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead(user.id);
        fetchNotifications();
    };

    const handleDelete = async (e, notificationId) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
        fetchNotifications();
    };

    const getNotificationIcon = (type) => {
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        return colors[type] || colors.info;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                    />

                    {/* Dropdown Panel */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        width: '400px',
                        maxHeight: '500px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        color: 'var(--primary-color)',
                                        padding: '0.25rem 0.5rem'
                                    }}
                                >
                                    {showAll ? 'Unread Only' : 'Show All'}
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            color: 'var(--primary-color)',
                                            padding: '0.25rem 0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}
                                    >
                                        <CheckCheck size={14} /> Mark All Read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div style={{
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {notifications.length === 0 ? (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Bell size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <div>No notifications</div>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            backgroundColor: notification.is_read ? 'white' : '#eff6ff',
                                            transition: 'background-color 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#eff6ff'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: getNotificationIcon(notification.type),
                                                marginTop: '0.5rem',
                                                flexShrink: 0
                                            }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: notification.is_read ? '400' : '600',
                                                    marginBottom: '0.25rem',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {notification.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {notification.message}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {formatTime(notification.created_at)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '0.25rem',
                                                    color: 'var(--text-secondary)',
                                                    opacity: 0.5,
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
