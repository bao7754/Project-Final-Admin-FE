import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBook,
  FiCheckCircle,
  FiCalendar,
  FiTrendingUp,
  FiHeart,
  FiRefreshCw,
  FiEye,
  FiEdit3,
  FiStar,
  FiUsers,
  FiActivity,
  FiDollarSign,
  FiAward,
  FiPackage,
  FiCreditCard
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { useRecipes } from '../hooks/useRecipes';
import { useFavorites } from '../hooks/userFavorites';
import { usepremiumUsers, useAnalyticsPremium } from '../hooks/useAuth'; 
import { packApi } from '../api/index'; // Import API function
import Loading from '../components/Loading';

const Dashboard = () => {
  const { data, isLoading, refetch } = useRecipes(1, 9999);
  const { data: favoritesData, isLoading: favoritesLoading } = useFavorites();
  // Sử dụng đúng hook để lấy dữ liệu premium users
  const { data: premiumData, isLoading: premiumLoading } = usepremiumUsers();
  // Thêm hook cho analytics premium
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsPremium();

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [packDetails, setPackDetails] = useState({});

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen for storage events to detect changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'recipe_updated' || e.key === 'recipe_approved') {
        handleRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch pack details for analytics data
  useEffect(() => {
    const fetchPackDetails = async () => {
      if (analyticsData && Array.isArray(analyticsData)) {
        const packIds = [];
        analyticsData.forEach(monthData => {
          if (monthData.packs) {
            monthData.packs.forEach(pack => {
              if (pack.pack_id && pack.pack_id !== null && !packIds.includes(pack.pack_id)) {
                packIds.push(pack.pack_id);
              }
            });
          }
        });

        const packDetailsMap = {};
        for (const packId of packIds) {
          try {
            const packDetail = await packApi.getPackById(packId);
            packDetailsMap[packId] = packDetail;
          } catch (error) {
            console.error(`Failed to fetch pack details for ${packId}:`, error);
          }
        }
        setPackDetails(packDetailsMap);
      }
    };

    fetchPackDetails();
  }, [analyticsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Process premium analytics data
  const premiumAnalytics = useMemo(() => {
    if (!analyticsData || !Array.isArray(analyticsData)) {
      return {
        totalPremiumSubscriptions: 0,
        totalRevenue: 0,
        packStats: [],
        monthlyData: [],
        validPacksOnly: []
      };
    }

    let totalPremiumSubscriptions = 0;
    let totalRevenue = 0;
    const packStatsMap = {};
    const monthlyData = [];

    analyticsData.forEach(monthData => {
      const monthStr = `${monthData._id.month}/${monthData._id.year}`;
      let monthlyRevenue = 0;
      let monthlyValidCount = 0;

      if (monthData.packs) {
        monthData.packs.forEach(pack => {
          // Chỉ thống kê các pack có pack_id hợp lệ (không null)
          if (pack.pack_id && pack.pack_id !== null) {
            const packDetail = packDetails[pack.pack_id];
            const packPrice = packDetail?.price || 20000; // Default price if not found
            const packName = packDetail?.name || pack.pack_name || 'Unknown Pack';

            totalPremiumSubscriptions += pack.count;
            const packRevenue = pack.count * packPrice;
            totalRevenue += packRevenue;
            monthlyRevenue += packRevenue;
            monthlyValidCount += pack.count;

            // Update pack statistics
            if (packStatsMap[pack.pack_id]) {
              packStatsMap[pack.pack_id].count += pack.count;
              packStatsMap[pack.pack_id].revenue += packRevenue;
            } else {
              packStatsMap[pack.pack_id] = {
                id: pack.pack_id,
                name: packName,
                count: pack.count,
                price: packPrice,
                revenue: packRevenue
              };
            }
          }
        });
      }

      monthlyData.push({
        month: monthStr,
        count: monthlyValidCount,
        revenue: monthlyRevenue
      });
    });

    const packStats = Object.values(packStatsMap).sort((a, b) => b.count - a.count);

    return {
      totalPremiumSubscriptions,
      totalRevenue,
      packStats,
      monthlyData: monthlyData.reverse(), // Show newest first
      validPacksOnly: packStats
    };
  }, [analyticsData, packDetails]);

  // Computed statistics
  const stats = useMemo(() => {
    if (!data?.data) return {
      totalRecipes: 0,
      approvedRecipes: 0,
      pendingRecipes: 0,
      approvalRate: 0,
      trendData: [],
      categoryData: [],
      topFavoriteRecipes: [],
      totalUsers: 0,
      totalPremiumUsers: 0,
      totalCookedRecipes: 0,
      totalRevenue: 0,
      premiumRate: 0
    };

    const recipes = data.data || [];
    const totalRecipes = data.pagination?.total || 0;
    const approvedRecipes = data.pagination?.approvedCount ||
      recipes.filter(recipe => Boolean(recipe.approvedAt)).length || 0;
    const pendingRecipes = totalRecipes - approvedRecipes;

    // Premium user statistics - sử dụng dữ liệu từ API
    const totalPremiumUsers = premiumData?.totalPremiumUsers || 0;
    const totalUsers = premiumData?.totalUsers || 0;
    const totalCookedRecipes = premiumData?.totalCookedRecipes || 0;
    
    // Tính toán doanh thu dựa trên premium analytics
    const totalRevenue = premiumAnalytics.totalRevenue;
    const premiumRate = totalUsers > 0 ? Math.round((totalPremiumUsers / totalUsers) * 100) : 0;

    // Calculate trend data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayRecipes = recipes.filter(recipe => {
        const recipeDate = new Date(recipe.createdAt);
        return recipeDate.toDateString() === date.toDateString();
      });
      last7Days.push({
        date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        recipes: dayRecipes.length,
        approved: dayRecipes.filter(r => r.approvedAt).length
      });
    }

    // Category distribution
    const categoryStats = {};
    recipes.forEach(recipe => {
      const categoryIds = recipe.categoryIds || [];
      categoryIds.forEach(cat => {
        const catName = cat?.name || cat || 'Khác';
        categoryStats[catName] = (categoryStats[catName] || 0) + 1;
      });
    });

    const categoryData = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Process favorites data to get top favorite recipes
    const favoriteRecipeStats = {};
    const favoritesArray = Array.isArray(favoritesData) ? favoritesData : [];
    
    favoritesArray.forEach(favorite => {
      if (favorite?.recipeId?.id) {
        const recipeId = favorite.recipeId.id;
        if (favoriteRecipeStats[recipeId]) {
          favoriteRecipeStats[recipeId].count++;
        } else {
          favoriteRecipeStats[recipeId] = {
            count: 1,
            recipe: favorite.recipeId
          };
        }
      }
    });

    const topFavoriteRecipes = Object.values(favoriteRecipeStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        ...item.recipe,
        favoriteCount: item.count
      }));

    return {
      totalRecipes,
      approvedRecipes,
      pendingRecipes,
      approvalRate: totalRecipes > 0 ? Math.round((approvedRecipes / totalRecipes) * 100) : 0,
      trendData: last7Days,
      categoryData,
      topFavoriteRecipes,
      // Premium user stats
      totalUsers,
      totalPremiumUsers,
      totalCookedRecipes,
      totalRevenue,
      premiumRate
    };
  }, [data, favoritesData, premiumData, premiumAnalytics]);

  if (isLoading || favoritesLoading || premiumLoading || analyticsLoading) return <Loading />;

  const latestRecipes = [...(data?.data || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const PACK_COLORS = ['#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Tổng quan về hệ thống công thức nấu ăn
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="text-sm text-gray-500 flex items-center">
              <FiActivity className="h-4 w-4 mr-2 text-blue-500" />
              Cập nhật: {lastRefresh.toLocaleTimeString('vi-VN')}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* Updated Stats Cards with Premium Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiBook className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số công thức</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecipes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiPackage className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gói đã bán</p>
                <p className="text-2xl font-bold text-gray-900">{premiumAnalytics.totalPremiumSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Pack Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Pack Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-cyan-100 rounded-lg mr-3">
                <FiPackage className="h-5 w-5 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Phân bố gói Premium</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={premiumAnalytics.packStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {premiumAnalytics.packStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PACK_COLORS[index % PACK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [value + ' gói', name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FiTrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Doanh thu theo tháng</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={premiumAnalytics.monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Doanh thu'];
                    }
                    return [value + ' gói', 'Số lượng'];
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  name="Doanh thu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Premium Pack Details Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <FiCreditCard className="h-5 w-5 text-purple-600" />
              </div>
              Chi tiết gói Premium
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên gói
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {premiumAnalytics.packStats.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-gray-100 rounded-full mb-3">
                          <FiPackage className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Chưa có dữ liệu gói Premium</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  premiumAnalytics.packStats.map((pack, index) => {
                    return (
                      <tr key={pack.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div 
                              className="h-3 w-3 rounded-full mr-3"
                              style={{ backgroundColor: PACK_COLORS[index % PACK_COLORS.length] }}
                            ></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {pack.name}
                              </div>
                            
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(pack.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {pack.count} gói
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(pack.revenue)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New User Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Recipe Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FiTrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Xu hướng công thức</h3>
              <span className="ml-auto text-sm text-gray-500">7 ngày qua</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorRecipes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="recipes"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorRecipes)"
                  name="Tổng số công thức"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <FiActivity className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Phân bố danh mục</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {stats.categoryData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Summary Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Tổng quan doanh thu Premium</h3>
              <p className="text-emerald-100 mb-4">
                Doanh thu từ {premiumAnalytics.totalPremiumSubscriptions} gói đã bán
              </p>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <div className="text-right">
              <div className="p-4 bg-opacity-20 rounded-lg">
                <FiAward className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Gói bán chạy</p>
                <p className="font-bold">
                  {premiumAnalytics.packStats[0]?.name || 'Chưa có'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Latest Recipes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FiBook className="h-5 w-5 text-blue-600" />
              </div>
              10 Công thức mới nhất
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Công thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiCalendar className="h-4 w-4 mr-1 text-gray-400" />
                      Ngày tạo
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {latestRecipes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-gray-100 rounded-full mb-3">
                          <FiBook className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Không có công thức nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  latestRecipes.map((recipe) => {
                
                    return (
                      <tr key={recipe._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={recipe.imageUrls?.[0] || 'https://via.placeholder.com/40x40'}
                              alt=""
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {recipe.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <FiBook className="h-3 w-3 mr-1 text-gray-400" />
                                {recipe.categoryIds?.map(c => c.name || c).join(', ') || 'Chưa phân loại'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(recipe.createdAt).toLocaleTimeString('vi-VN')}
                          </div>
                        </td>
                       
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/recipes/${recipe._id}`}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                            >
                              <FiEye className="h-3 w-3 mr-1" />
                              Xem
                            </Link>
                            <Link
                              to={`/recipes/edit/${recipe._id}`}
                              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            >
                              <FiEdit3 className="h-3 w-3 mr-1" />
                              Sửa
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;