// Every text of the "uniforme" landing page. Change them here to test another message.

// e.g. '213661234567' (no + or spaces): the footer shows the WhatsApp link once it is set
export const WHATSAPP_NUMBER = '';
export { SHOP_PHONE, FACEBOOK_PAGE } from '../../lib/shop';

export const content = {
    title: 'الدخول المدرسي بأناقة',
    subtitle: 'قميص + تنورة مطوية + كرافات — 3 ألوان',
    cta: 'اطلبي الآن — الدفع عند الاستلام',
    deliveryNote: 'توصيل خلال 24 إلى 48 ساعة',

    // The pack selected when the page opens
    defaultPack: 1,
    packs: [
        { quantity: 1, label: 'طقم واحد' },
        { quantity: 2, label: 'طقمين' },
        { quantity: 3, label: '3 أطقم' },
    ],

    // Color names as saved on the product -> how the page shows them
    colorLabels: {
        'Bleu marine': 'كحلي',
        Noir: 'أسود',
        Bordeaux: 'بوردو',
    },

    inside: [
        { icon: 'shirt', text: 'قميص أبيض بأكمام طويلة' },
        { icon: 'skirt', text: 'تنورة مطوية بخطوط' },
        { icon: 'tie', text: 'كرافات بنفس القماش' },
    ],
    insideNote: 'الطقم كامل، ما تحتاجي والو آخر',

    qualityTitle: 'قماش ثقيل، ما يتكرمشش',
    galleryTitle: 'إطلالة الطقم',

    sizeChart: [
        ['4 سنوات', '98 - 104 سم'],
        ['5 سنوات', '104 - 110 سم'],
        ['6 سنوات', '110 - 116 سم'],
        ['7 سنوات', '116 - 122 سم'],
        ['8 سنوات', '122 - 128 سم'],
        ['9 سنوات', '128 - 134 سم'],
        ['10 سنوات', '134 - 140 سم'],
        ['11 سنة', '140 - 146 سم'],
        ['12 سنة', '146 - 152 سم'],
    ],
    sizeNote: 'ماشي متأكدة من المقاس؟ نتصلو بيك قبل ما نبعثو الطلب ونختاروه معاك.',

    trustTitle: 'ليما الأمهات يثقوا فينا',
    trust: [
        { icon: 'cash', text: 'الدفع عند الاستلام' },
        { icon: 'truck', text: 'توصيل خلال 24 إلى 48 ساعة' },
        { icon: 'swap', text: 'تبديل المقاس متاح' },
        { icon: 'phone', text: 'نتصلو بيك لتأكيد المقاس' },
    ],

    formTitle: 'أكملي الطلب — الدفع عند الاستلام',
    formNote: 'ما تخلصيش حتى توصلك السلعة',

    faq: [
        {
            q: 'كيفاش نخلص؟',
            a: 'تخلصي كاش لعامل التوصيل كي توصلك السلعة. ما تخلصي والو قبل.',
        },
        {
            q: 'قداش ياخذ التوصيل؟',
            a: 'من 24 إلى 48 ساعة، لباب الدار ولا لمكتب ZR Express اللي تختاريه.',
        },
        {
            q: 'قداش سعر التوصيل؟',
            a: 'يبان في الاستمارة كي تختاري الولاية والبلدية، بالسعر الحقيقي تاع ZR Express.',
        },
        {
            q: 'إذا المقاس ما جاش؟',
            a: 'نبدلوه لك بمقاس آخر وتخلصي غير مصاريف التوصيل. وباش ما يصراش، نتصلو بيك قبل ما نبعثو الطلب ونتأكدو من المقاس معاك.',
        },
        {
            q: 'واش كاين في الطقم؟',
            a: 'قميص أبيض بأكمام طويلة، تنورة مطوية بخطوط، وكرافات بنفس القماش — طقم كامل وجاهز.',
        },
    ],

    tagline: 'Luxury kids wear',
};
