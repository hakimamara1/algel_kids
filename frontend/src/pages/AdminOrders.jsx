import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { trackEvent } from '../utils/FacebookPixel';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null); // For detail view modal

    // Fetch Orders
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/orders`);
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Handlers
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${id}/status`, { status: newStatus });
            fetchOrders(); // Refresh
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleSendToDelivery = async (order) => {
        if (!confirm(`Send order for ${order.customer.name} to Delivery Provider?`)) return;

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${order._id}/delivery`);
            alert(`Success: ${data.message} (Tracking: ${data.result.trackingCode})`);
            fetchOrders();
        } catch (error) {
            alert('Failed to send to delivery');
        }
    };

    // Filtering
    const filteredOrders = filter === 'All'
        ? orders
        : orders.filter(o => o.status === filter);

    // Stats
    const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'Pending').length;

    if (loading) return <div className="p-10 text-center">Loading orders...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} DA</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Orders</h3>
                        <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Orders</h3>
                        <p className="text-3xl font-bold text-orange-500">{pendingCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Delivered</h3>
                        <p className="text-3xl font-bold text-blue-500">{orders.filter(o => o.status === 'Delivered').length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                    {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === f ? 'bg-black text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

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
                                {filteredOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-gray-900">{order.customer.name}</p>
                                            <p className="text-xs text-gray-500">{order.customer.phone}</p>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            <div className="flex items-center space-x-3">
                                                {order.product?.images?.[0] && (
                                                    <img src={order.product.images[0].url} className="w-10 h-10 rounded-lg object-cover" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{order.product?.title || 'Unknown Product'}</p>
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                        {order.variant.color} / {order.variant.size}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            {order.customer.wilaya}
                                            <br /><span className="text-xs text-gray-400">{order.customer.commune}</span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-900">
                                            {order.pricing.totalPrice} DA
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${order.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                                                    order.status === 'Confirmed' ? 'bg-blue-100 text-blue-600' :
                                                        order.status === 'Shipped' ? 'bg-purple-100 text-purple-600' :
                                                            order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>

                                                {/* Delivery Action */}
                                                {(order.status === 'Confirmed' || order.status === 'Pending') && (
                                                    <button
                                                        onClick={() => handleSendToDelivery(order)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Send to Delivery"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    </button>
                                                )}

                                                {/* Status Dropdown (Simplified) */}
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                    className="text-xs border-gray-200 rounded-lg focus:ring-pink-500"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-bold mb-4">Order Details</h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Customer Info</h3>
                                <p><span className="text-gray-500">Name:</span> {selectedOrder.customer.name}</p>
                                <p><span className="text-gray-500">Phone:</span> {selectedOrder.customer.phone}</p>
                                <p><span className="text-gray-500">Address:</span> {selectedOrder.customer.address}</p>
                                <p><span className="text-gray-500">Location:</span> {selectedOrder.customer.commune}, {selectedOrder.customer.wilaya}</p>
                            </div>

                            <div className="bg-pink-50 p-4 rounded-xl">
                                <h3 className="text-sm font-bold text-pink-900 mb-2 uppercase tracking-wide">Order Info</h3>
                                <p><span className="text-pink-700">Product:</span> {selectedOrder.product?.title}</p>
                                <p><span className="text-pink-700">Variant:</span> {selectedOrder.variant.color} - {selectedOrder.variant.size}</p>
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
