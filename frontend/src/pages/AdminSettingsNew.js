import React, { useState, useEffect } from 'react';
import { settingsAPI, adminAPI, apiUtils } from '../services/api';

const AdminSettingsNew = ({ user, addNotification }) => {
  const [activeTab, setActiveTab] = useState('notifications');

  // Tab configuration
  const tabs = [
    { id: 'notifications', name: 'Email Notifications', icon: '📧' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'activity', name: 'Activity Logs', icon: '📊' },
    { id: 'password', name: 'Password Management', icon: '🔐' },
    { id: 'exports', name: 'Data Export', icon: '📤' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings user={user} addNotification={addNotification} />;
      case 'users':
        return <UserManagement addNotification={addNotification} />;
      case 'activity':
        return <ActivityLogs addNotification={addNotification} />;
      case 'password':
        return <PasswordManagement user={user} addNotification={addNotification} />;
      case 'exports':
        return <DataExport addNotification={addNotification} />;
      default:
        return <NotificationSettings user={user} addNotification={addNotification} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">
          Manage system settings, users, and monitor activity.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Notification Settings Component (existing functionality)
const NotificationSettings = ({ user, addNotification }) => {
  const [settings, setSettings] = useState({
    notify_on_new_loops: true,
    notify_on_updated_loops: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingName, value) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateNotificationPreferences(settings);
      
      if (response.data.success) {
        addNotification('Notification preferences saved successfully', 'success');
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Email Notification Preferences</h3>
      </div>
      <div className="card-body space-y-6">
        {/* New Loops Notification */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h4 className="settings-item-title">New Loop Created</h4>
            <p className="settings-item-description">
              Get notified when a new transaction loop is created by any agent.
            </p>
          </div>
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={settings.notify_on_new_loops}
              onChange={(e) => handleSettingChange('notify_on_new_loops', e.target.checked)}
              className="notification-checkbox"
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Updated Loops Notification */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h4 className="settings-item-title">Loop Updated</h4>
            <p className="settings-item-description">
              Get notified when an existing transaction loop is modified.
            </p>
          </div>
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={settings.notify_on_updated_loops}
              onChange={(e) => handleSettingChange('notify_on_updated_loops', e.target.checked)}
              className="notification-checkbox"
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Email Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-2">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900">Email Configuration</h4>
              <p className="text-sm text-blue-700 mt-1">
                Notifications will be sent to: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = ({ addNotification }) => {
  const [users, setUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, activityResponse] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getUserActivitySummary()
      ]);
      
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
      }
      
      if (activityResponse.data.success) {
        setUserActivity(activityResponse.data.userActivity);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Registered Users ({users.length})</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Activity Summary</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const activity = userActivity.find(a => a.id === user.id);
                  return (
                    <tr key={user.id}>
                      <td className="font-medium">#{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`status-badge ${user.role === 'admin' ? 'status-closing' : 'status-active'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="text-sm">
                          <div>Total: {activity?.total_activities || 0} actions</div>
                          <div>Logins: {activity?.login_count || 0}</div>
                          <div>Last: {activity?.last_activity ? new Date(activity.last_activity).toLocaleDateString() : 'Never'}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Logs Component
const ActivityLogs = ({ addNotification }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getActivityLogs({
        ...filters,
        limit: 100
      });
      
      if (response.data.success) {
        setLogs(response.data.logs);
        setStats(response.data.stats);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportLogs = async () => {
    try {
      const response = await adminAPI.exportActivityLogs(filters);
      apiUtils.downloadFile(response.data, 'activity-logs.csv');
      addNotification('Activity logs exported successfully', 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.today_activities || 0}</div>
              <div className="text-sm text-gray-600">Today</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.week_activities || 0}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_logins || 0}</div>
              <div className="text-sm text-gray-600">Total Logins</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.total_activities || 0}</div>
              <div className="text-sm text-gray-600">All Activities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOOP_CREATED">Loop Created</option>
                <option value="LOOP_UPDATED">Loop Updated</option>
                <option value="PASSWORD_CHANGED">Password Changed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={exportLogs} className="btn btn-secondary">
              📤 Export Logs (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Activity Logs ({logs.length})</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm">{new Date(log.created_at).toLocaleString()}</td>
                      <td>
                        <div>
                          <div className="font-medium">{log.user_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          log.action_type === 'LOGIN' ? 'status-active' :
                          log.action_type.includes('LOOP') ? 'status-closing' :
                          'status-closed'
                        }`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="max-w-xs truncate">{log.description}</td>
                      <td className="text-sm text-gray-500">{log.ip_address || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Password Management Component
const PasswordManagement = ({ user, addNotification }) => {
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key, value) => {
    setPasswordData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.changePassword({
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        addNotification('Password changed successfully', 'success');
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Change Your Password</h3>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Confirm new password"
          />
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Security Note:</strong> Your password must be at least 6 characters long. 
            Choose a strong password that you haven't used elsewhere.
          </p>
        </div>
      </div>
      <div className="card-footer">
        <div className="flex justify-end">
          <button
            onClick={changePassword}
            disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Data Export Component
const DataExport = ({ addNotification }) => {
  const [loading, setLoading] = useState({});

  const exportData = async (type) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      let response;
      let filename;

      switch (type) {
        case 'users':
          response = await adminAPI.exportUserList();
          filename = 'user-list.csv';
          break;
        case 'logs':
          response = await adminAPI.exportActivityLogs();
          filename = 'activity-logs.csv';
          break;
        default:
          throw new Error('Unknown export type');
      }

      apiUtils.downloadFile(response.data, filename);
      addNotification(`${type} exported successfully`, 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const exportOptions = [
    {
      id: 'users',
      title: 'User List Export',
      description: 'Export complete list of registered users with their details',
      icon: '👥',
      filename: 'user-list.csv'
    },
    {
      id: 'logs',
      title: 'Activity Logs Export',
      description: 'Export all system activity logs including logins and actions',
      icon: '📊',
      filename: 'activity-logs.csv'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Data Export Options</h3>
        </div>
        <div className="card-body space-y-4">
          {exportOptions.map((option) => (
            <div key={option.id} className="settings-item">
              <div className="settings-item-content">
                <h4 className="settings-item-title flex items-center">
                  <span className="mr-2">{option.icon}</span>
                  {option.title}
                </h4>
                <p className="settings-item-description">{option.description}</p>
                <p className="text-xs text-gray-500 mt-1">File: {option.filename}</p>
              </div>
              <button
                onClick={() => exportData(option.id)}
                disabled={loading[option.id]}
                className="btn btn-secondary"
              >
                {loading[option.id] ? (
                  <>
                    <div className="spinner"></div>
                    Exporting...
                  </>
                ) : (
                  '📤 Export'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsNew;
