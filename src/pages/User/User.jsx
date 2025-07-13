import React, { useEffect, useState } from 'react';
import { FiMail, FiPhone, FiHome, FiUser, FiEye, FiPackage } from 'react-icons/fi';
import { useUsers } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        setError('');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useUsers()
            .then((data) => {
                setUsers(Array.isArray(data?.users) ? data.users : []);
                setLoading(false);
            })
            .catch(() => {
                setError('Có lỗi khi tải danh sách người dùng!');
                setLoading(false);
            });
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date)) return '—';
        return `${date.toLocaleTimeString('vi-VN')} ${date.getDate()}/${date.getMonth() + 1
            }/${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-600 text-lg font-semibold bg-red-100 p-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-20 md:pl-72 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                    Danh Sách Người Dùng
                </h1>
            </div>
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
                            <tr>
                                <th className="p-4">STT</th>
                                <th className="p-4">Avatar</th>
                                <th className="p-4">Họ Tên</th>
                                <th className="p-4">Thông Tin</th>
                                <th className="p-4">Ngày Cập Nhật</th>
                                <th className="p-4 text-center">Chức Năng</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {users.map((u, idx) => (
                                <tr
                                    key={u.id || idx}
                                    className="border-b transition-colors duration-200 hover:bg-gray-50"
                                >
                                    <td className="p-4 text-sm font-medium">{idx + 1}</td>
                                    <td className="p-4">
                                        {u.avatar ? (
                                            <img
                                                src={u.avatar}
                                                alt={u.fullName}
                                                className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover transform hover:scale-105 transition-transform duration-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500">
                                                <FiUser />
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-semibold text-base">{u.fullName}</td>
                                    <td className="p-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center text-gray-600">
                                                <FiMail className="mr-2 text-blue-500" /> {u.email}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <FiPhone className="mr-2 text-green-500" />{' '}
                                                {u.phone || '—'}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <FiHome className="mr-2 text-purple-500" />{' '}
                                                {u.address || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {formatDate(u.updatedAt || u.createdAt)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-3 items-center">
                                            <button
                                                className="flex items-center gap-2 px-6 py-2 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium w-48"
                                                onClick={() => navigate(`/users/${u.id}`)}
                                            >
                                                <FiEye /> Xem Chi Tiết
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserList;