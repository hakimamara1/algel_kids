import React, { useState, useEffect, useCallback } from 'react';
import adminApi, { apiErrorMessage } from '../lib/adminApi';

const PAGE_SIZE = 30;
const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLES = {
    Pending: 'bg-orange-100 text-orange-600',
    Confirmed: 'bg-blue-100 text-blue-600',
    Shipped: 'bg-purple-100 text-purple-600',
    Delivered: 'bg-green-100 text-green-600',
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [counts, setCounts] = useState({});
    const [deliveredRevenue, setDeliveredRevenue] = useState(0);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('All');
    const [reloadKey, setReloadKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null); // For detail view modal

    const fetchPage = useCallback(async (status, pageToLoad) => {
        const params = { page: pageToLoad, limit: PAGE_SIZE, ...(status !== 'All' && { status }) };
        const { data } = await adminApi.get('/orders', { params });
        return data;
    }, []);

    // First page, again whenever the filter changes or after a status update
    useEffect(() => {
        let cancelled = false;
        fetchPage(filter, 1)
            .then((data) => {
                if (cancelled) return;
                setOrders(data.orders);
                setPage(1);
                setTotal(data.total);
                setCounts(data.counts);
                setDeliveredRevenue(data.deliveredRevenue);
                setError('');
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(apiErrorMessage(err, 'Could not load orders'));
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [filter, reloadKey, fetchPage]);

    const changeFilter = (next) => {
        if (next === filter) return;
        setLoading(true);
        setFilter(next);
    };

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const data = await fetchPage(filter, page + 1);
            setOrders((prev) => [...prev, ...data.orders]);
            setPage(page + 1);
            setTotal(data.total);
        } catch (err) {
            setError(apiErrorMessage(err, 'Could not load more orders'));
        } finally {
            setLoadingMore(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const { data } = await adminApi.put(`/orders/${id}/status`, { status: newStatus });
            setNotice(data.warning || '');
            setReloadKey((key) => key + 1);
        } catch (err) {
            setNotice(apiErrorMessage(err, 'Failed to update status'));
        }
    };

    const allCount = STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);

    if (loading) return <div className="p-10 text-center">Loading orders...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Delivered revenue</p>
                        <p className="text-2xl font-bold text-green-600">{deliveredRevenue.toLocaleString()} DA</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Orders</h3>
                        <p className="text-3xl font-bold text-gray-900">{allCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Orders</h3>
                        <p className="text-3xl font-bold text-orange-500">{counts.Pending || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Delivered</h3>
                        <p className="text-3xl font-bold text-blue-500">{counts.Delivered || 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['All', ...STATUSES].map((status) => (
                        <button
                            key={status}
                            onClick={() => changeFilter(status)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filter === status ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                            {status} ({status === 'All' ? allCount : counts[status] || 0})
                        </button>
                    ))}
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
                {notice && (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-lg mb-6 flex justify-between gap-4">
                        <span>{notice}</span>
                        <button onClick={() => setNotice('')} className="font-bold" aria-label="Dismiss">×</button>
                    </div>
                )}

                {/* Orders Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Wilaya</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-gray-900">{order.customer.name}</p>
                                            <a href={`tel:${order.customer.phone}`} className="text-xs text-gray-500 hover:text-gray-900">{order.customer.phone}</a>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-3">
                                                {order.product?.images?.[0] && (
                                                    <img src={order.product.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{order.product?.title || 'Unknown Product'}</p>
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                        {order.variant?.color} / {order.variant?.size}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            {order.customer.wilaya}
                                            <br /><span className="text-xs text-gray-400">{order.customer.commune}</span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                                            {order.pricing.totalPrice} DA
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                                    title="View Details"
                                                    aria-label="View details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>

                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                    className="text-xs border-gray-200 rounded-lg focus:ring-pink-500"
                                                    aria-label="Change status"
                                                >
                                                    {STATUSES.map((status) => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && !error && <div className="p-6 text-center text-gray-500">No orders here yet.</div>}
                    </div>
                </div>

                {orders.length < total && (
                    <div className="text-center mt-6">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="bg-white border border-gray-200 px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                        >
                            {loadingMore ? 'Loading…' : `Load more (${total - orders.length} left)`}
                        </button>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-bold mb-4">Order Details</h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Customer Info</h3>
                                <p><span className="text-gray-500">Name:</span> {selectedOrder.customer.name}</p>
                                <p><span className="text-gray-500">Phone:</span> <a href={`tel:${selectedOrder.customer.phone}`} className="underline">{selectedOrder.customer.phone}</a></p>
                                <p><span className="text-gray-500">Address:</span> {selectedOrder.customer.address}</p>
                                <p><span className="text-gray-500">Location:</span> {selectedOrder.customer.commune}, {selectedOrder.customer.wilaya}</p>
                                <p><span className="text-gray-500">Delivery:</span> {selectedOrder.customer.deliveryType === 'desk' ? 'Stop desk' : 'Home'}</p>
                            </div>

                            <div className="bg-pink-50 p-4 rounded-xl">
                                <h3 className="text-sm font-bold text-pink-900 mb-2 uppercase tracking-wide">Order Info</h3>
                                <p><span className="text-pink-700">Product:</span> {selectedOrder.product?.title}</p>
                                <p><span className="text-pink-700">Variant:</span> {selectedOrder.variant?.color} - {selectedOrder.variant?.size}</p>
                                <p><span className="text-pink-700">Price:</span> {selectedOrder.pricing.itemPrice} DA</p>
                                <p><span className="text-pink-700">Shipping:</span> {selectedOrder.pricing.shippingPrice} DA</p>
                                <div className="mt-2 pt-2 border-t border-pink-200 font-bold text-lg">
                                    Total: {selectedOrder.pricing.totalPrice} DA
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
