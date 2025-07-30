import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';
import ImageFeatureDemo from './ImageFeatureDemo';

const Dashboard = ({ user, addNotification, isAdmin = false }) => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closing: 0,
    closed: 0,
    total_sales: 0,
    closing_soon: 0
  });
  const [closingLoops, setClosingLoops] = useState([]);
  const [recentLoops, setRecentLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await loopAPI.getStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch closing loops
      const closingResponse = await loopAPI.getClosingLoops();
      if (closingResponse.data.success) {
        setClosingLoops(closingResponse.data.loops);
      }

      // Fetch recent loops
      const recentResponse = await loopAPI.getLoops({ limit: 5 });
      if (recentResponse.data.success) {
        setRecentLoops(recentResponse.data.loops);
      }

    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExportCSV = async () => {
    try {
      const response = await loopAPI.exportCSV();
      apiUtils.downloadFile(response.data, 'loops-export.csv');
      addNotification('CSV exported successfully', 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-badge status-active',
      closing: 'status-badge status-closing',
      closed: 'status-badge status-closed',
      cancelled: 'status-badge status-cancelled'
    };

    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Admin Dashboard' : 'Agent Dashboard'} - 
            Here's what's happening with your transactions.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/loops/new" className="btn btn-primary">
            New Loop
          </Link>
          {isAdmin && (
            <button onClick={handleExportCSV} className="btn btn-secondary">
              Export All
            </button>
          )}
        </div>
      </div>

      {/* Image Feature Demo */}
      <ImageFeatureDemo />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Loops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closing Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.closing_soon}</p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${stats.total_sales ? parseFloat(stats.total_sales).toLocaleString() : '0'}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </div>
      </div>

      {/* Closing Soon Alert */}
      {closingLoops.length > 0 && (
        <div className="alert alert-warning">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <div>
              <strong>Attention:</strong> You have {closingLoops.length} loop{closingLoops.length !== 1 ? 's' : ''} closing within the next 3 days.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closing Soon */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Loops Closing Soon</h3>
          </div>
          <div className="card-body">
            {closingLoops.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-600">No loops closing in the next 3 days</p>
              </div>
            ) : (
              <div className="space-y-4">
                {closingLoops.slice(0, 5).map((loop) => (
                  <div key={loop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{loop.id}</span>
                        {getStatusBadge(loop.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {loop.property_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Client: {loop.client_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {dateUtils.getCountdownText(loop.end_date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dateUtils.formatDate(loop.end_date)}
                      </p>
                    </div>
                  </div>
                ))}
                {closingLoops.length > 5 && (
                  <div className="text-center">
                    <Link to={isAdmin ? "/dashboard/admin" : "/dashboard/agent"} className="text-blue-600 hover:text-blue-500 text-sm">
                      View all {closingLoops.length} closing loops
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Loops</h3>
          </div>
          <div className="card-body">
            {recentLoops.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600 mb-4">No loops yet</p>
                <Link to="/loops/new" className="btn btn-primary btn-sm">
                  Create Your First Loop
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLoops.map((loop) => (
                  <div key={loop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{loop.id}</span>
                        {getStatusBadge(loop.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {loop.property_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loop.type} • {loop.client_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dateUtils.getRelativeTime(loop.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <Link to={isAdmin ? "/dashboard/admin" : "/dashboard/agent"} className="text-blue-600 hover:text-blue-500 text-sm">
                    View all loops
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/loops/new" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-2xl mr-3">➕</div>
              <div>
                <h4 className="font-medium text-blue-900">Create New Loop</h4>
                <p className="text-sm text-blue-700">Start a new transaction</p>
              </div>
            </Link>

            <button 
              onClick={handleExportCSV}
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h4 className="font-medium text-green-900">Export Data</h4>
                <p className="text-sm text-green-700">Download CSV report</p>
              </div>
            </button>

            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <h4 className="font-medium text-gray-900">Performance</h4>
                <p className="text-sm text-gray-700">
                  {stats.closed} completed this month
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
