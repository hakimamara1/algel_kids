import React, { useEffect, useState } from 'react';
import adminApi, { apiErrorMessage } from '../../lib/adminApi';
import { getProduct } from '../../lib/api';

// After the confirmation call: fix the color/size (while Pending, before stock is taken)
// or the address (until the parcel is at ZR Express).
const OrderEditor = ({ order, onSaved }) => {
    const canChangeVariant = order.status === 'Pending';
    const canChangeAddress = !order.delivery?.parcelId;
    const productId = order.product?._id;

    const [colors, setColors] = useState(null);
    const [color, setColor] = useState(order.variant?.color || '');
    const [size, setSize] = useState(order.variant?.size || '');
    const [address, setAddress] = useState(order.customer?.address || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!canChangeVariant || !productId) return undefined;
        let cancelled = false;
        getProduct(productId)
            .then((product) => {
                if (!cancelled) setColors(product.colors || []);
            })
            .catch(() => {
                if (!cancelled) setMessage('Could not load the sizes of this product.');
            });
        return () => {
            cancelled = true;
        };
    }, [canChangeVariant, productId]);

    if (!canChangeVariant && !canChangeAddress) return null;

    const sizes = colors?.find((entry) => entry.name === color)?.sizes || [];

    const chooseColor = (name) => {
        setColor(name);
        const next = colors?.find((entry) => entry.name === name);
        if (next?.sizes?.length && !next.sizes.some((entry) => entry.value === size)) setSize('');
    };

    const save = async () => {
        const body = {};
        if (canChangeVariant && (color !== (order.variant?.color || '') || size !== (order.variant?.size || ''))) {
            if (sizes.length && !size) {
                setMessage('Choose a size.');
                return;
            }
            body.color = color;
            if (size) body.size = size;
        }
        const newAddress = address.trim();
        if (canChangeAddress && newAddress !== (order.customer?.address || '')) {
            if (!newAddress && order.customer?.deliveryType !== 'desk') {
                setMessage('Home delivery needs an address.');
                return;
            }
            body.address = newAddress;
        }
        if (!Object.keys(body).length) {
            setMessage('Nothing changed.');
            return;
        }

        setSaving(true);
        setMessage('');
        try {
            const { data } = await adminApi.patch(`/orders/${order._id}`, body);
            onSaved(data);
            setMessage(data.warning || 'Saved.');
        } catch (err) {
            setMessage(apiErrorMessage(err, 'Could not save the changes'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-amber-50 p-4 rounded-xl space-y-3 text-sm">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">After the call</h3>

            {canChangeVariant && colors === null && !message && <p className="text-gray-500">Loading sizes…</p>}

            {canChangeVariant && colors?.length > 0 && (
                <label className="block">
                    <span className="text-amber-800">Color</span>
                    <select
                        value={color}
                        onChange={(e) => chooseColor(e.target.value)}
                        className="mt-1 w-full rounded-lg border-gray-200 text-sm"
                    >
                        {colors.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
                    </select>
                </label>
            )}

            {canChangeVariant && sizes.length > 0 && (
                <div role="group" aria-label="Size">
                    <span className="text-amber-800">Size</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {sizes.map((entry) => {
                            const selected = entry.value === size;
                            const empty = Number(entry.stock) <= 0;
                            return (
                                <button
                                    key={entry.value}
                                    type="button"
                                    onClick={() => setSize(entry.value)}
                                    aria-pressed={selected}
                                    title={empty ? 'No stock left' : undefined}
                                    className={`min-w-[3rem] px-3 py-2 rounded-lg border-2 font-bold ${selected ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 bg-white text-gray-700'} ${empty ? 'opacity-50' : ''}`}
                                >
                                    {entry.value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {canChangeAddress && (
                <label className="block">
                    <span className="text-amber-800">Address</span>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        maxLength={300}
                        className="mt-1 w-full rounded-lg border-gray-200 text-sm"
                    />
                </label>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="bg-black text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
                {message && <span role="status" className="text-amber-900">{message}</span>}
            </div>
        </div>
    );
};

export default OrderEditor;
