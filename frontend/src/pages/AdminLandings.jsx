import React, { useEffect, useState } from 'react';
import adminApi, { apiErrorMessage } from '../lib/adminApi';
import landings from '../landings/landings.json';

// Days in Algeria time, like the server counts them
const algeriaDay = (date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const daysAgo = (count) => algeriaDay(new Date(Date.now() - count * 24 * 60 * 60 * 1000));

const RANGES = [
    { id: 'today', label: 'Today', from: () => daysAgo(0) },
    { id: '7d', label: '7 days', from: () => daysAgo(6) },
    { id: '30d', label: '30 days', from: () => daysAgo(29) },
];

const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 1000) / 10}%` : '—');
const money = (value) => `${Number(value || 0).toLocaleString('fr-FR')} DA`;

const pageName = (row) => {
    if (landings[row.landing]) return { name: landings[row.landing].name, link: `/l/${row.landing}` };
    if (row.productId) return { name: `Product page · ${row.productTitle || 'deleted product'}`, link: `/product/${row.productId}` };
    return { name: row.landing, link: null };
};

// Compare landing pages (and product pages) on the same days: visitors -> form steps -> orders -> outcome
const AdminLandings = () => {
    const [range, setRange] = useState('7d');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const from = RANGES.find((entry) => entry.id === range).from();
        adminApi.get('/admin/landing-stats', { params: { from, to: algeriaDay() } })
            .then(({ data: result }) => {
                if (cancelled) return;
                setData(result);
                setError('');
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Could not load the landing page results'));
            });
        return () => {
            cancelled = true;
        };
    }, [range]);

    const rows = data?.rows || [];

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Landing pages</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Same days for every page. Wait for about 100 visitors per page before choosing a winner.
                        </p>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Date range">
                        {RANGES.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => setRange(entry.id)}
                                aria-pressed={range === entry.id}
                                className={`px-4 py-2 rounded-full text-sm font-semibold ${range === entry.id ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
                {!data && !error && <p className="text-gray-500">Loading…</p>}

                {data && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="p-4">Page</th>
                                        <th className="p-4 text-right">Visitors</th>
                                        <th className="p-4 text-right" title="Started filling the order form">Form started</th>
                                        <th className="p-4 text-right" title="Chose a wilaya and saw the delivery price">Chose wilaya</th>
                                        <th className="p-4 text-right" title="Pressed the order button">Pressed order</th>
                                        <th className="p-4 text-right">Orders</th>
                                        <th className="p-4 text-right" title="Orders ÷ visitors">Conversion</th>
                                        <th className="p-4 text-right" title="Confirmed on the phone (then shipped, delivered or returned)">Confirmed</th>
                                        <th className="p-4 text-right">Delivered</th>
                                        <th className="p-4 text-right">Returned</th>
                                        <th className="p-4 text-right" title="Product or pack price of delivered orders">Sales</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.map((row) => {
                                        const { name, link } = pageName(row);
                                        return (
                                            <tr key={row.landing} className="hover:bg-gray-50 align-top">
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-900">{name}</p>
                                                    {link && <a href={link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{link}</a>}
                                                </td>
                                                <td className="p-4 text-right font-semibold">{row.views}</td>
                                                <td className="p-4 text-right">{row.checkouts} <span className="block text-xs text-gray-400">{percent(row.checkouts, row.views)}</span></td>
                                                <td className="p-4 text-right">{row.wilaya} <span className="block text-xs text-gray-400">{percent(row.wilaya, row.views)}</span></td>
                                                <td className="p-4 text-right">{row.submit} <span className="block text-xs text-gray-400">{percent(row.submit, row.views)}</span></td>
                                                <td className="p-4 text-right font-bold text-gray-900">
                                                    {row.orders}
                                                    {row.pieces > row.orders && <span className="block text-xs font-normal text-gray-400">{row.pieces} pieces</span>}
                                                </td>
                                                <td className="p-4 text-right font-bold text-green-700">{percent(row.orders, row.views)}</td>
                                                <td className="p-4 text-right">{row.confirmed} <span className="block text-xs text-gray-400">{percent(row.confirmed, row.orders)}</span></td>
                                                <td className="p-4 text-right">{row.delivered}</td>
                                                <td className="p-4 text-right text-red-600">{row.returned}</td>
                                                <td className="p-4 text-right font-semibold whitespace-nowrap">{money(row.sales)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {rows.length === 0 && <div className="p-6 text-center text-gray-500">No visitors or orders on these days yet.</div>}
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-4">
                    Visitors are counted once per browser tab. Orders placed before landing pages existed count for their product page.
                    {data && ` Days: ${data.from} → ${data.to} (Algeria time).`}
                </p>
            </div>
        </div>
    );
};

export default AdminLandings;
