// Every text and photo of the "ginseng" landing page (Bellevia DZ — GINSENG KIANPI PIL).
// Change them here to test another message.
//
// Wording rule for this page: we only say what is printed on the box or visible in the photos.
// No promise about appetite, weight or health — Meta rejects those claims for supplements,
// and we cannot stand behind them. The page sells on "check the box is genuine before you pay".

export { SHOP_PHONE, FACEBOOK_PAGE } from '../../lib/shop';

// Photos uploaded to Cloudinary (folder malaksit-landing/ginseng)
const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photo = (path) => `${CLD}/${path}`;

export const images = {
    // Also the product's photo in the database, so index.html preloads exactly this file
    hero: photo('v1791245206/malaksit-landing/ginseng/dujuijhx32ptqykgibul.webp'),
    sticker: photo('v1791245207/malaksit-landing/ginseng/vqkexzbbodwebn9o5idd.png'),
    verifyScreen: photo('v1791245208/malaksit-landing/ginseng/x2gvrogzdcpogcvzqwvb.png'),
    contents: photo('v1791245209/malaksit-landing/ginseng/d2g2cxxewp4xpxl3vrts.webp'),
    leaflet: photo('v1791245211/malaksit-landing/ginseng/yj9xyxhkvtz6w8oxj3xl.webp'),
};

export const content = {
    brand: 'Bellevia DZ',
    productName: 'GINSENG KIANPI PIL',
    pageTitle: 'GINSENG KIANPI PIL',

    title: 'تحقّق من أصالة العبوة بنفسك قبل ما تخلّص',
    subtitle: 'كل علبة فيها ملصق أمان WISDOM برمز QR ورقم تسلسلي — امسحو بهاتفك وشوف بعينيك.',
    intro: 'GINSENG KIANPI PIL — تركيبة أعشاب صينية تقليدية. العلبة فيها 60 كبسولة، وطريقة الاستعمال المكتوبة على العبوة: كبسولة واحدة في الليل قبل النوم.',
    priceFrom: 'ابتداءً من',
    priceNote: 'العلبة فيها 60 كبسولة',
    cta: 'اطلب الآن',
    ctaVerify: 'تحقّق من الأصالة',
    deliveryNote: 'التوصيل لجميع الولايات · الدفع عند الاستلام',

    // Drawn on the hero photo, over the security sticker (position in ginseng.css)
    qrCallout: 'امسح الرمز',
    heroFacts: [
        { icon: 'box', text: '60 كبسولة' },
        { icon: 'qr', text: 'ملصق WISDOM + QR' },
        { icon: 'cash', text: 'الدفع عند الاستلام' },
        { icon: 'truck', text: 'توصيل لكل الولايات' },
    ],
    // Shown under the price when the 2-box offer really is cheaper per box
    packHint: (price, perBox) => `أو علبتان بـ ${price} دج — العلبة بـ ${perBox} دج`,

    // The pack chosen when the page opens (2 boxes = the one the design marks "الأكثر طلبًا")
    defaultPack: 2,
    packs: [
        { quantity: 1, label: 'علبة واحدة', tag: 'للتجربة' },
        { quantity: 2, label: 'علبتان', tag: 'الأكثر طلبًا', highlight: true },
        { quantity: 3, label: '3 علب', tag: 'أفضل سعر', best: true },
    ],
    offersTitle: 'اختر العرض المناسب لك',
    offersEyebrow: 'العروض',
    offersNote: 'كل العروض بنفس الشروط: الدفع عند الاستلام، والتوصيل يُحسب حسب ولايتك.',
    offersCta: 'أكمل طلبك',
    perBoxLabel: 'العلبة بـ',
    perBoxInsteadOf: 'بدل',
    chosenLabel: 'العرض المحدَّد',
    chooseLabel: 'اختر هذا العرض',

    usageEyebrow: '3 خطوات',
    usageTitle: 'طريقة الاستعمال المكتوبة على العبوة',
    usage: [
        { icon: 'capsule', text: 'كبسولة واحدة' },
        { icon: 'moon', text: 'في الليل قبل النوم' },
        { icon: 'glass', text: 'مع كوب من الماء' },
    ],
    usageNote: 'هذه هي طريقة الاستعمال المقدمة مع المنتج. اتبع دائمًا التعليمات المكتوبة على العبوة ولا تتجاوز الجرعة.',
    usageBar: 'العلبة فيها 60 كبسولة',

    // Printed on the bottle itself — we repeat it rather than hide it
    safetyTitle: 'قبل الاستعمال',
    safety: [
        'هذا مكمّل غذائي بتركيبة أعشاب، وماشي دواء ولا بديل عن العلاج.',
        'مكتوب على العبوة: ماشي مخصص للحوامل والمرضعات ولا للأطفال أقل من 12 سنة.',
        'إذا عندك مرض مزمن ولا تتابع علاج، استشر طبيبك قبل ما تستعمله.',
        'قائمة المكونات مطبوعة على العبوة باللغة الصينية.',
    ],

    verifyEyebrow: 'الأصالة',
    verifyTitle: 'كيفاش تتحقّق من العبوة؟',
    verifyLead: 'ما تعتمدش غير على كلمة «أصلي» — تحقّق بنفسك في أقل من دقيقة.',
    verifySteps: [
        'امسك العبوة في يدك',
        'امسح رمز QR اللي على ملصق الأمان',
        'تتفتح لك صفحة التحقق تاع WISDOM',
        'قارن الرقم التسلسلي مع المطبوع على العبوة',
    ],
    verifyStickerCaption: 'ملصق الأمان مع رمز QR والرقم التسلسلي.',
    verifyScreenCaption: 'صفحة التحقق كيما تبان بعد مسح الرمز.',
    // What the QR really proves — said plainly, so nobody feels misled after they scan
    verifyHonest: 'رمز QR يثبت أن ملصق الأمان صادر عن WISDOM ويعرض عدد المرات اللي تحقّق فيها ناس من نفس الرقم. ما يعطيش تحليل للمكونات.',
    // A link to the verification site, if the supplier gives one. Empty = the page only explains the steps.
    verifyUrl: '',

    detailsEyebrow: 'صور حقيقية',
    detailsTitle: 'العبوة من كل جهة',
    detailsPhotos: [
        { key: 'contents', caption: 'القارورة، العلبة، الأكياس وبطاقة الشهادة.' },
        { key: 'leaflet', caption: 'الكيس الداخلي والنشرة المطوية.' },
    ],

    formEyebrow: 'الطلب',
    formTitle: 'اطلب الآن',
    formSubtitle: 'عمّر المعلومات. الدفع عند الاستلام.',
    formNote: 'ما تخلّصش حتى توصلك السلعة',

    faqTitle: 'أسئلة شائعة',
    faq: [
        { q: 'شحال من كبسولة في العلبة؟', a: 'العلبة فيها 60 كبسولة.' },
        { q: 'كيفاش نستعملو؟', a: 'حسب طريقة الاستعمال المقدمة مع المنتج: كبسولة واحدة في الليل قبل النوم مع كوب ماء. اتبع دائمًا التعليمات المكتوبة على العبوة.' },
        { q: 'كيفاش نتحقّق أن العبوة أصلية؟', a: 'امسح رمز QR اللي على ملصق الأمان، تتفتح صفحة التحقق تاع WISDOM، ثم قارن الرقم التسلسلي مع المطبوع على العبوة.' },
        { q: 'واش هو هذا المنتج بالضبط؟', a: 'مكمّل غذائي بتركيبة أعشاب صينية تقليدية. ماشي دواء، وقائمة المكونات مطبوعة على العبوة بالصينية.' },
        { q: 'كاين الدفع عند الاستلام؟', a: 'إيه، تخلّص كاش لعامل التوصيل كي توصلك السلعة.' },
        { q: 'شحال ياخذ التوصيل وشحال سعرو؟', a: 'من 24 إلى 48 ساعة حسب الولاية. سعر التوصيل الحقيقي تاع ZR Express يبان في الاستمارة كي تختار الولاية والبلدية.' },
    ],

    finalTitle: 'ابدأ بخطوتك الأولى',
    finalText: 'اختر العرض المناسب لك، واستعمل رمز التحقق الموجود على العبوة باش تتأكد من المعلومات.',

    tagline: 'منتجات أصلية بملصق تحقّق',
};
