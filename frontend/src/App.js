import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CreateLoop from './pages/CreateLoop';
import EditLoop from './pages/EditLoop';
import NotificationAlert from './components/NotificationAlert';
import { apiUtils } from './services/api';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const notificationCounter = useRef(0);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = () => {
      const isAuth = apiUtils.isAuthenticated();
      const currentUser = apiUtils.getCurrentUser();
      
      setIsAuthenticated(isAuth);
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (token, userData) => {
    apiUtils.setAuth(token, userData);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    apiUtils.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
  };

  const addNotification = (message, type = 'info') => {
    notificationCounter.current += 1;
    const id = `notification-${Date.now()}-${notificationCounter.current}`;
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route
                path="/login"
                element={
                  <Login
                    onLogin={handleLogin}
                    addNotification={addNotification}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>

        {/* Global Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <NotificationAlert
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Router>
        <div className="app-container">
          <Sidebar user={user} onLogout={handleLogout} />

          <div className="content">
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    to={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent'}
                    replace
                  />
                }
              />

              <Route
                path="/dashboard/admin"
                element={
                  user?.role === 'admin' ? (
                    <AdminDashboard
                      user={user}
                      addNotification={addNotification}
                    />
                  ) : (
                    <Navigate to="/dashboard/agent" replace />
                  )
                }
              />

              <Route
                path="/dashboard/agent"
                element={
                  <AgentDashboard
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route
                path="/loops/new"
                element={
                  <CreateLoop
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route
                path="/loops/edit/:id"
                element={
                  <EditLoop
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>

      {/* Global Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationAlert
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </>
  );
};

export default App;
