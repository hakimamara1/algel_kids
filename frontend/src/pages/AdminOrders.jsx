import React, { useState, useEffect, useCallback } from 'react';
import adminApi, { apiErrorMessage } from '../lib/adminApi';

const PAGE_SIZE = 30;
const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];

const STATUS_STYLES = {
    Pending: 'bg-orange-100 text-orange-600',
    Confirmed: 'bg-blue-100 text-blue-600',
    Shipped: 'bg-purple-100 text-purple-600',
    Delivered: 'bg-green-100 text-green-600',
    Returned: 'bg-red-100 text-red-600',
};

// Connection problems worth showing above the orders
const zrWarnings = (status) => {
    if (!status) return [];
    if (!status.configured) return ['ZR Express is not connected yet: add ZR_API_KEY and ZR_TENANT_ID on Render.'];
    const warnings = [];
    if (!status.ready) warnings.push('ZR prices could not be loaded yet: the order form uses the fixed prices.');
    if (!status.webhookConfigured) warnings.push('ZR status updates are not connected: run "npm run zr:webhook" and set ZR_WEBHOOK_SECRET.');
    if (status.daysLeft != null && status.daysLeft <= 14) {
        warnings.push(status.daysLeft <= 0
            ? 'Your ZR API key has expired: create a new one in the ZR portal and update ZR_API_KEY.'
            : `Your ZR API key expires in ${status.daysLeft} day(s): create a new one in the ZR portal.`);
    }
    return warnings;
};

const DeliveryCell = ({ order, zrConnected, busy, onAction, onCopy }) => {
    const delivery = order.delivery;
    if (delivery?.parcelId) {
        return (
            <div className="space-y-1">
                {delivery.trackingNumber ? (
                    <button onClick={() => onCopy(delivery.trackingNumber)} className="font-mono text-xs underline decoration-dotted" title="Copy tracking number">
                        {delivery.trackingNumber}
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">Tracking number pending</span>
                )}
                {delivery.state?.name && (
                    <span className="block text-xs font-semibold" style={{ color: delivery.state.color || undefined }}>
                        {delivery.state.name}
                    </span>
                )}
                {delivery.situation?.name && <span className="block text-xs text-gray-500">{delivery.situation.name}</span>}
                <div className="flex gap-2 pt-1">
                    <button disabled={busy} onClick={() => onAction(order._id, 'refresh')} className="text-xs text-blue-600 hover:underline disabled:opacity-50">Refresh</button>
                    {order.status === 'Shipped' && (
                        <button disabled={busy} onClick={() => onAction(order._id, 'cancel')} className="text-xs text-red-600 hover:underline disabled:opacity-50">Cancel parcel</button>
                    )}
                </div>
            </div>
        );
    }
    if (order.status !== 'Confirmed') return <span className="text-xs text-gray-400">—</span>;
    if (!order.customer?.zr?.communeId) return <span className="text-xs text-gray-500">Create in ZR portal</span>;
    return (
        <button
            disabled={busy || !zrConnected}
            onClick={() => onAction(order._id, 'send')}
            className="bg-black text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            title={zrConnected ? 'Create the parcel at ZR Express' : 'ZR Express is not connected yet'}
        >
            {busy ? 'Sending…' : 'Send to ZR'}
        </button>
    );
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
    const [zrStatus, setZrStatus] = useState(null);
    const [busyOrderId, setBusyOrderId] = useState(null);
    const [bulkBusy, setBulkBusy] = useState(false);

    const fetchPage = useCallback(async (status, pageToLoad) => {
        const params = { page: pageToLoad, limit: PAGE_SIZE, ...(status !== 'All' && { status }) };
        const { data } = await adminApi.get('/orders', { params });
        return data;
    }, []);

    // First page, again whenever the filter changes or after an action
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

    useEffect(() => {
        adminApi.get('/admin/zr-status')
            .then(({ data }) => setZrStatus(data))
            .catch(() => setZrStatus(null));
    }, [reloadKey]);

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

    const handleDeliveryAction = async (id, action) => {
        if (action === 'cancel' && !window.confirm('Cancel this parcel at ZR Express? (Only possible before pickup.)')) return;
        setBusyOrderId(id);
        try {
            if (action === 'send') {
                const { data } = await adminApi.post(`/orders/${id}/delivery`);
                setNotice(`Sent to ZR Express${data.delivery?.trackingNumber ? `: ${data.delivery.trackingNumber}` : ' (tracking number coming soon, use Refresh)'}`);
            } else if (action === 'cancel') {
                await adminApi.delete(`/orders/${id}/delivery`);
                setNotice('Parcel cancelled at ZR Express. The order is back to Confirmed.');
            } else {
                await adminApi.post(`/orders/${id}/delivery/refresh`);
            }
            setReloadKey((key) => key + 1);
        } catch (err) {
            setNotice(apiErrorMessage(err, 'ZR Express action failed'));
        } finally {
            setBusyOrderId(null);
        }
    };

    const sendAllConfirmed = async () => {
        if (!window.confirm('Send all confirmed orders to ZR Express?')) return;
        setBulkBusy(true);
        try {
            const { data } = await adminApi.post('/orders/delivery/bulk');
            const failed = data.failed.length ? ` · ${data.failed.length} failed: ${data.failed.map((f) => f.message).join(' | ')}` : '';
            setNotice(`Sent ${data.sent.length} order(s) to ZR Express${failed}`);
            setReloadKey((key) => key + 1);
        } catch (err) {
            setNotice(apiErrorMessage(err, 'Could not send the orders'));
        } finally {
            setBulkBusy(false);
        }
    };

    const printLabels = async () => {
        const ids = orders.filter((order) => order.delivery?.trackingNumber).map((order) => order._id);
        if (!ids.length) {
            setNotice('No order on this page has a tracking number yet.');
            return;
        }
        // Open the tab now (browsers block pop-ups opened after a network wait)
        const labelsWindow = window.open('', '_blank');
        try {
            const { data } = await adminApi.post('/orders/delivery/labels', { orderIds: ids.slice(0, 100) });
            if (labelsWindow) labelsWindow.location.href = data.fileUrl;
            else window.location.href = data.fileUrl;
            if (data.failed?.length) setNotice(`No label for: ${data.failed.join(', ')}`);
        } catch (err) {
            labelsWindow?.close();
            setNotice(apiErrorMessage(err, 'Could not create the labels'));
        }
    };

    const copyTracking = async (tracking) => {
        try {
            await navigator.clipboard.writeText(tracking);
            setNotice(`Copied ${tracking}`);
        } catch {
            setNotice(tracking);
        }
    };

    const allCount = STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);
    const zrConnected = Boolean(zrStatus?.configured);
    const warnings = zrWarnings(zrStatus);

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

                {warnings.map((warning) => (
                    <div key={warning} className="bg-amber-50 text-amber-800 p-3 rounded-lg mb-3 text-sm">{warning}</div>
                ))}

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
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Delivered · Returned</h3>
                        <p className="text-3xl font-bold text-blue-500">{counts.Delivered || 0} <span className="text-red-500 text-2xl">· {counts.Returned || 0}</span></p>
                    </div>
                </div>

                {/* ZR Express actions */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={sendAllConfirmed}
                        disabled={!zrConnected || bulkBusy || !counts.Confirmed}
                        className="bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                    >
                        {bulkBusy ? 'Sending…' : `Send all confirmed to ZR (${counts.Confirmed || 0})`}
                    </button>
                    <button
                        onClick={printLabels}
                        disabled={!zrConnected}
                        className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Print labels (this page)
                    </button>
                    {zrStatus?.updatedAt && (
                        <span className="self-center text-xs text-gray-500">ZR prices updated {new Date(zrStatus.updatedAt).toLocaleString()}</span>
                    )}
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
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ZR Express</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors align-top">
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
                                            {order.customer.deliveryType === 'desk' && (
                                                <span className="block text-xs text-gray-500">Office{order.customer.zr?.hubName ? `: ${order.customer.zr.hubName}` : ''}</span>
                                            )}
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
                                            <DeliveryCell
                                                order={order}
                                                zrConnected={zrConnected}
                                                busy={busyOrderId === order._id}
                                                onAction={handleDeliveryAction}
                                                onCopy={copyTracking}
                                            />
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
                                <p><span className="text-gray-500">Delivery:</span> {selectedOrder.customer.deliveryType === 'desk' ? `ZR office${selectedOrder.customer.zr?.hubName ? ` · ${selectedOrder.customer.zr.hubName}` : ''}` : 'Home'}</p>
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

                            {selectedOrder.delivery?.parcelId && (
                                <div className="bg-blue-50 p-4 rounded-xl text-sm">
                                    <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">ZR Express</h3>
                                    <p><span className="text-blue-700">Tracking:</span> <span className="font-mono">{selectedOrder.delivery.trackingNumber || 'pending'}</span></p>
                                    <p><span className="text-blue-700">State:</span> {selectedOrder.delivery.state?.name || '—'}</p>
                                    {selectedOrder.delivery.situation?.name && <p><span className="text-blue-700">Situation:</span> {selectedOrder.delivery.situation.name}</p>}
                                    {selectedOrder.delivery.sentAt && <p><span className="text-blue-700">Sent:</span> {new Date(selectedOrder.delivery.sentAt).toLocaleString()}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
