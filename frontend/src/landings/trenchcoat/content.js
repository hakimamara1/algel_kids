// Every text and photo of the "trench-coat" landing page (Angels closet — Trench Élégant).
// Change them here to test another message.
//
// The photos are generated images of the real coat, not photographs of the parcel that ships,
// so no caption here claims otherwise.

export { SHOP_PHONE, FACEBOOK_PAGE } from '../../lib/shop';

// Photos uploaded to Cloudinary (folder malaksit-landing/trenchelegant)
const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photo = (path) => `${CLD}/${path}`;

const DIR = 'malaksit-landing/trenchelegant';

export const images = {
    logo: photo('v1789924693/malaksit-landing/blouse/dtaqu1hkmrcwoupgblfn.png'),
    // Also the product's photo in the database, so index.html preloads the file the page shows
    hero: photo(`v1794155403/${DIR}/ijdxbedxhs2m2h2xoika.webp`),
    // The three colours side by side with the length and the collar/cuff/button close-ups
    chart: photo(`v1794155448/${DIR}/nytkv8xaqfyxyjndvtqu.webp`),
};

export const content = {
    brand: 'Angels closet',
    // Shown in the browser tab, and the order the colours appear in
    pageTitle: 'Trench Élégant',
    defaultColorName: 'Taupe',
    colorOrder: ['Taupe', 'Marron caramel', 'Beige clair'],
    title: 'Trench Élégant — معطف يكمّل أي إطلالة',
    subtitle: 'قصة واسعة بأكمام منفوخة وأزرار ذهبية — طول 105 سم، 3 ألوان',
    priceNote: 'للقطعة الواحدة',
    cta: 'اطلبي الآن — الدفع عند الاستلام',
    deliveryNote: 'توصيل إلى جميع ولايات الوطن',

    // The pack chosen when the page opens
    defaultPack: 1,
    packs: [
        { quantity: 1, label: 'قطعة واحدة' },
        { quantity: 2, label: 'قطعتان' },
        { quantity: 3, label: '3 قطع' },
    ],
    offersTitle: 'عروض خاصة',
    offersCta: 'أكملي طلبك',

    // Colour names as saved on the product -> how the page shows them
    colorLabels: {
        Taupe: 'Taupe',
        'Marron caramel': 'Marron Caramel',
        'Beige clair': 'Beige Clair',
    },
    colorsTitle: 'الألوان المتوفرة',
    colorPhotos: {
        Taupe: photo(`v1794155405/${DIR}/lfbtu2sfack2q8eoat9e.webp`),
        'Marron caramel': photo(`v1794155406/${DIR}/qps29w4koeagfnaj3sgz.webp`),
        'Beige clair': photo(`v1794155407/${DIR}/youh5phj5kokjhgzeokj.webp`),
    },
    // Colours that are finished: shown so she sees what the shop sells, never orderable.
    // A colour whose stock reaches 0 is marked sold out by the page itself, so this stays empty.
    soldOutColors: [],
    inStockLabel: 'متوفر',
    soldOutLabel: 'نفذت الكمية',

    sizesTitle: 'المقاسات المتوفرة',
    sizesNote: 'طول المعطف 105 سم. اختاري مقاسك عند إتمام الطلب، ونتصلو بيك نتأكدو معاك قبل ما نبعثو.',

    galleryTitle: 'المعطف عن قرب',
    // Two shots that show the coat on a body, for scale
    gallery: [
        photo(`v1794155408/${DIR}/wszfvumaomeov9awdocg.webp`),
        photo(`v1794155409/${DIR}/twm33iyzxpnomz8och6a.webp`),
    ],

    formTitle: 'أكملي طلبك الآن',
    formSubtitle: 'الدفع عند الاستلام، في جميع ولايات الجزائر',
    formNote: 'ما تخلصيش حتى توصلك السلعة',

    faqTitle: 'أسئلة شائعة',
    faq: [
        { q: 'كيفاش نخلص؟', a: 'تخلصي كاش لعامل التوصيل كي توصلك السلعة. ما تخلصي والو قبل.' },
        { q: 'قداش ياخذ التوصيل؟', a: 'من 24 إلى 48 ساعة، لباب الدار ولا لمكتب ZR Express اللي تختاريه.' },
        { q: 'قداش سعر التوصيل؟', a: 'يبان في الاستمارة كي تختاري الولاية والبلدية، بالسعر الحقيقي تاع ZR Express.' },
        { q: 'شحال طول المعطف؟', a: 'طول المعطف 105 سم في كل المقاسات.' },
        { q: 'واش هي المقاسات؟', a: 'ثلاث مقاسات: 46 و 48 و 50.' },
        {
            q: 'إذا المقاس ما جاش؟',
            a: 'نبدلوه لك بمقاس آخر وتخلصي غير مصاريف التوصيل. وباش ما يصراش، نتصلو بيك قبل ما نبعثو الطلب ونتأكدو من المقاس معاك.',
        },
        { q: 'واش هي الألوان المتوفرة؟', a: '3 ألوان: Taupe و Marron Caramel و Beige Clair.' },
    ],

    tagline: 'بلوزات أنيقة لكل الجزائريات',
};
