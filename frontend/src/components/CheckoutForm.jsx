import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { wilayas, getShippingRate } from '../data/algeriaData';
import { trackEvent } from '../utils/FacebookPixel';

const CheckoutForm = ({ product, variant, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        wilaya: '',
        commune: '',
        address: '',
        deliveryType: 'home' // 'home' or 'desk'
    });

    const [availableCommunes, setAvailableCommunes] = useState([]);
    const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success, error
    const [errorMessage, setErrorMessage] = useState('');

    // Shipping Calculation
    const selectedWilayaData = wilayas.find(w => w.name === formData.wilaya);
    const wilayaCode = selectedWilayaData ? selectedWilayaData.code : 'default';
    const rates = getShippingRate(wilayaCode);
    const shippingPrice = formData.deliveryType === 'home' ? rates.home : rates.desk;

    // Total Calculation
    const totalPrice = product.price + shippingPrice;

    useEffect(() => {
        if (selectedWilayaData) {
            setAvailableCommunes(selectedWilayaData.communes);
            setFormData(prev => ({ ...prev, commune: selectedWilayaData.communes[0] || '' }));
        } else {
            setAvailableCommunes([]);
        }
    }, [formData.wilaya]);

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Only numbers
        if (val.length <= 10) {
            setFormData({ ...formData, phone: val });
        }
    };

    const validatePhone = (phone) => {
        const regex = /^(05|06|07)[0-9]{8}$/;
        return regex.test(phone);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePhone(formData.phone)) {
            setErrorMessage('يرجى إدخال رقم هاتف صحيح (05، 06، أو 07)');
            return;
        }

        if (formData.deliveryType === 'home' && !formData.address) {
            setErrorMessage('العنوان مطلوب للتوصيل للمنزل');
            return;
        }

        setSubmitStatus('submitting');
        setErrorMessage('');

        const orderData = {
            product: product._id,
            variant: {
                color: variant?.color?.name,
                size: variant?.size?.value
            },
            customer: {
                ...formData
            },
            pricing: {
                itemPrice: product.price,
                shippingPrice,
                totalPrice
            }
        };

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/orders`, orderData);

            trackEvent('Purchase', {
                currency: 'DZD',
                value: totalPrice,
                content_name: product.title,
                content_ids: [product._id]
            });

            setSubmitStatus('success');
            setTimeout(() => {
                onClose(); // Close the form after success
                alert('تم تسجيل طلبك بنجاح! سنتصل بك قريباً.');
            }, 2000);

        } catch (err) {
            console.error(err);
            setSubmitStatus('error');
            setErrorMessage('حدث خطأ ما. يرجى المحاولة مرة أخرى.');
        }
    };

    if (submitStatus === 'success') {
        return (
            <div className="bg-white p-8 rounded-3xl text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">تم تأكيد طلبك!</h3>
                <p className="text-gray-500">شكراً لك، {formData.name}. سنتصل بك على الرقم {formData.phone} قريباً.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-b-3xl md:rounded-3xl space-y-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">شراء سريع</h2>

            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                    placeholder="الاسم واللقب"
                />
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-left"
                    style={{ direction: 'ltr' }}
                    placeholder="05 XX XX XX XX"
                />
            </div>

            {/* Wilaya & Commune */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الولاية</label>
                    <select
                        required
                        value={formData.wilaya}
                        onChange={e => setFormData({ ...formData, wilaya: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                    >
                        <option value="">اختر...</option>
                        {wilayas.map(w => (
                            <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البلدية</label>
                    <select
                        required
                        disabled={!availableCommunes.length}
                        value={formData.commune}
                        onChange={e => setFormData({ ...formData, commune: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    >
                        {availableCommunes.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Delivery Type */}
            <div className="flex bg-gray-50 p-1 rounded-xl">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryType: 'home' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${formData.deliveryType === 'home' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    المنزل ({rates.home} د.ج)
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryType: 'desk' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${formData.deliveryType === 'desk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    المكتب ({rates.desk} د.ج)
                </button>
            </div>

            {/* Address (Conditional) */}
            {formData.deliveryType === 'home' && (
                <div className="animate-fade-in-down">
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المنزل</label>
                    <textarea
                        required
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 min-h-[80px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                        placeholder="الحي، الشارع، رقم المنزل..."
                    />
                </div>
            )}

            {/* Summary */}
            <div className="bg-pink-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>المنتج</span>
                    <span>{product.price} د.ج</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>التوصيل</span>
                    <span>{shippingPrice} د.ج</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-pink-100">
                    <span>الإجمالي</span>
                    <span>{totalPrice} د.ج</span>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
                    {errorMessage}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
                {submitStatus === 'submitting' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <span>تأكيد الطلب - {totalPrice} د.ج</span>
                )}
            </button>
        </form>
    );
};

export default CheckoutForm;
