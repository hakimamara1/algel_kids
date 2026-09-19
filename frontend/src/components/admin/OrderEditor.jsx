import React, { useEffect, useState } from 'react';
import adminApi, { apiErrorMessage } from '../../lib/adminApi';
import { getProduct } from '../../lib/api';
import { orderPieces } from '../../lib/orderPieces';

// After the confirmation call: fix each piece's color/size (while Pending, before stock is taken)
// or the address (until the parcel is at ZR Express).
const OrderEditor = ({ order, onSaved }) => {
    const canChangePieces = order.status === 'Pending';
    const canChangeAddress = !order.delivery?.parcelId;
    const productId = order.product?._id;
    const savedPieces = orderPieces(order);

    const [colors, setColors] = useState(null);
    const [pieces, setPieces] = useState(() => (savedPieces.length ? savedPieces : [{}]).map((piece) => ({
        color: piece.color || '',
        size: piece.size || '',
    })));
    const [address, setAddress] = useState(order.customer?.address || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!canChangePieces || !productId) return undefined;
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
    }, [canChangePieces, productId]);

    if (!canChangePieces && !canChangeAddress) return null;

    const sizesOf = (colorName) => colors?.find((entry) => entry.name === colorName)?.sizes || [];

    const updatePiece = (index, changes) => {
        setPieces((prev) => prev.map((piece, i) => {
            if (i !== index) return piece;
            const next = { ...piece, ...changes };
            // Another color without the chosen size: pick the size again
            if (changes.color !== undefined && sizesOf(changes.color).length && !sizesOf(changes.color).some((entry) => entry.value === next.size)) {
                next.size = '';
            }
            return next;
        }));
    };

    const save = async () => {
        const body = {};
        const piecesChanged = pieces.some((piece, index) => piece.color !== (savedPieces[index]?.color || '') || piece.size !== (savedPieces[index]?.size || ''));
        if (canChangePieces && piecesChanged) {
            const missing = pieces.findIndex((piece) => sizesOf(piece.color).length && !piece.size);
            if (missing >= 0) {
                setMessage(pieces.length > 1 ? `Choose a size for piece ${missing + 1}.` : 'Choose a size.');
                return;
            }
            body.items = pieces.map(({ color, size }) => ({ color, ...(size && { size }) }));
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

            {canChangePieces && colors === null && !message && <p className="text-gray-500">Loading sizes…</p>}

            {canChangePieces && colors?.length > 0 && pieces.map((piece, index) => (
                <div key={index} className="space-y-2 border-b border-amber-100 pb-3 last:border-0 last:pb-0">
                    {pieces.length > 1 && <p className="font-bold text-amber-900">Piece {index + 1}</p>}
                    <label className="block">
                        <span className="text-amber-800">Color</span>
                        <select
                            value={piece.color}
                            onChange={(e) => updatePiece(index, { color: e.target.value })}
                            className="mt-1 w-full rounded-lg border-gray-200 text-sm"
                        >
                            {colors.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
                        </select>
                    </label>
                    {sizesOf(piece.color).length > 0 && (
                        <div role="group" aria-label={`Size of piece ${index + 1}`}>
                            <span className="text-amber-800">Size</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {sizesOf(piece.color).map((entry) => {
                                    const selected = entry.value === piece.size;
                                    const empty = Number(entry.stock) <= 0;
                                    return (
                                        <button
                                            key={entry.value}
                                            type="button"
                                            onClick={() => updatePiece(index, { size: entry.value })}
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
                </div>
            ))}

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
