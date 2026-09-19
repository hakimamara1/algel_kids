// Color codes typed in the admin are sometimes "CFB08C#" or " #5A3A2E": repair them so the swatch still shows
export const swatchColor = (hex) => {
    const value = String(hex || '').trim();
    const digits = value.replace(/#/g, '');
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(digits)) return `#${digits}`;
    if (typeof CSS !== 'undefined' && CSS.supports?.('color', value)) return value;
    return '#E5E7EB';
};
