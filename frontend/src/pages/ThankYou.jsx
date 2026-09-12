import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MESSENGER_PAGE = 'https://www.messenger.com/t/113440880526598';
const SHOP_PHONE = '0662241056';

// Pre-filled Messenger message so the shop gets every detail in one tap
const orderMessage = (order) => `طلب جديد! 🛍️
المنتج: ${[order.productTitle, order.color, order.size].filter(Boolean).join(' - ')}
السعر: ${order.itemPrice} د.ج
التوصيل: ${order.shippingPrice} د.ج (${order.deliveryType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'})
الإجمالي: ${order.totalPrice} د.ج
-------------------
الاسم: ${order.name}
الهاتف: ${order.phone}
الولاية: ${order.wilaya}
البلدية: ${order.commune}
${order.deliveryType === 'home' ? `العنوان: ${order.address}` : ''}`;

const Row = ({ label, value }) => (
    <div className="flex justify-between gap-4 text-gray-600">
        <span className="whitespace-nowrap">{label}</span>
        <span className="text-gray-900 text-left">{value}</span>
    </div>
);

// Shown after an order is placed (the details come from the checkout, in the browser history state)
const ThankYou = () => {
    const { state } = useLocation();
    const order = state?.order;
    const messengerUrl = order ? `${MESSENGER_PAGE}?text=${encodeURIComponent(orderMessage(order))}` : MESSENGER_PAGE;

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="max-w-md mx-auto space-y-4">
                <section className="bg-white rounded-3xl p-6 text-center shadow-sm border border-gray-100 space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{order ? `شكراً ${order.name}!` : 'شكراً لك!'}</h1>
                    <p className="text-gray-600">
                        تم استلام طلبك. سنتصل بك قريباً
                        {order && <> على <span dir="ltr" className="font-semibold">{order.phone}</span></>}
                        {' '}لتأكيد الطلب.
                    </p>
                    <p className="text-sm text-gray-500">الدفع عند الاستلام، لا تدفع أي شيء الآن.</p>
                </section>

                {order && (
                    <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-2 text-sm">
                        <h2 className="font-bold text-gray-900 mb-1">ملخص الطلب</h2>
                        <Row label="المنتج" value={[order.productTitle, order.color, order.size].filter(Boolean).join(' · ')} />
                        <Row label="التوصيل" value={`${order.wilaya} · ${order.commune} (${order.deliveryType === 'home' ? 'للمنزل' : 'للمكتب'})`} />
                        {order.office && <Row label="المكتب" value={order.office} />}
                        <Row label="سعر التوصيل" value={`${order.shippingPrice} د.ج`} />
                        <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-bold text-gray-900">
                            <span>الإجمالي</span>
                            <span>{order.totalPrice} د.ج</span>
                        </div>
                    </section>
                )}

                <a
                    href={messengerUrl}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    <span>أكّد طلبك عبر ماسنجر</span>
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.9 1.408 5.485 3.593 7.155v3.425l3.29-1.815c1.002.288 2.062.435 3.117.435 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.096 12.336l-2.73-2.909-5.32 2.909 5.86-6.22 2.808 2.909 5.234-2.909-5.852 6.22z" /></svg>
                </a>
                <a
                    href={`tel:${SHOP_PHONE}`}
                    className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-gray-800 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                    اتصل بنا: <span dir="ltr">{SHOP_PHONE}</span>
                </a>
                <Link to="/" className="block text-center text-pink-600 font-semibold py-2">العودة إلى المتجر</Link>
            </div>
        </main>
    );
};

export default ThankYou;
