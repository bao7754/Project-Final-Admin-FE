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
  FiAward
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
import { usepremiumUsers } from '../hooks/useAuth'; 
import Loading from '../components/Loading';

const Dashboard = () => {
  const { data, isLoading, refetch } = useRecipes(1, 9999);
  const { data: favoritesData, isLoading: favoritesLoading } = useFavorites();
  // Sử dụng đúng hook để lấy dữ liệu premium users
  const { data: premiumData, isLoading: premiumLoading } = usepremiumUsers();

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    
    // Tính toán doanh thu dựa trên số premium users
    const premiumPrice = 20000; // 20,000 VND per premium user
    const totalRevenue = totalPremiumUsers * premiumPrice;
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
  }, [data, favoritesData, premiumData]);

  if (isLoading || favoritesLoading || premiumLoading) return <Loading />;

  const latestRecipes = [...(data?.data || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
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

        {/* Updated Stats Cards with Premium Users */}
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
                Doanh thu {stats.totalPremiumUsers} người dùng Premium
              </p>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <div className="text-right">
              <div className="p-4  bg-opacity-20 rounded-lg">
                <FiDollarSign className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Giá Premium</p>
                <p className="font-bold">20.000đ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Popular Recipes */}
        

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