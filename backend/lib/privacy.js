// Keeps logs useful without storing customer phone numbers: 0661234556 -> 06••••••56
const maskPhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length <= 4) return '••';
    return `${digits.slice(0, 2)}${'•'.repeat(digits.length - 4)}${digits.slice(-2)}`;
};

// Search terms (names, phones) must not reach the logs through the URL
const redactUrl = (url = '') => url.replace(/([?&]q=)[^&]*/g, '$1[redacted]');

module.exports = { maskPhone, redactUrl };
