// Every text and photo of the "trench-coat" landing page (Angels closet — Trench Élégant).
// Change them here to test another message.

export { SHOP_PHONE, FACEBOOK_PAGE } from '../../lib/shop';

// Photos uploaded to Cloudinary (folder malaksit-landing/trenchcoat).
// Each colour photo carries its own name printed on it, as the supplier sent them.
const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photo = (path) => `${CLD}/${path}`;
// The supplier burned the colour name into the bottom of each coat photo, and the page
// already captions it. This trims that strip off; the chart keeps its names on purpose.
const coat = (path) => `${CLD}/c_crop,h_0.90,g_north/${path}`;

export const images = {
    logo: photo('v1789924693/malaksit-landing/blouse/dtaqu1hkmrcwoupgblfn.png'),
    // Also the product's photo in the database, so index.html preloads the file the page shows
    hero: coat('v1791676629/malaksit-landing/trenchcoat/rfj3nnrhzqlo0ztepzba.webp'),
    // The eight colours side by side
    chart: photo('v1791676633/malaksit-landing/trenchcoat/ymmhrtmu8rs7it21l2mv.webp'),
};

export const content = {
    brand: 'Angels closet',
    // Shown in the browser tab, and the order the colours appear in
    pageTitle: 'Trench Élégant',
    defaultColorName: 'Marron caramel',
    colorOrder: [
        'Beige clair', 'Marron caramel', 'Taupe', 'Beige sable',
        'Marron chocolat', 'Ivoire', 'Vert kaki clair', 'Noir',
    ],
    title: 'Trench Élégant — معطف يكمّل أي إطلالة',
    subtitle: 'قصة واسعة بحزام مخفي وأكمام منفوخة — 8 ألوان، تايل ستاندار',
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
        'Beige clair': 'Beige Clair',
        'Marron caramel': 'Marron Caramel',
        Taupe: 'Taupe',
        'Beige sable': 'Beige Sable',
        'Marron chocolat': 'Marron Chocolat',
        Ivoire: 'Ivoire / Off-white',
        'Vert kaki clair': 'Vert Kaki Clair',
        Noir: 'Noir',
    },
    colorsTitle: 'الألوان المتوفرة — 8 ألوان',
    colorPhotos: {
        'Beige clair': coat('v1791676628/malaksit-landing/trenchcoat/ldzosxnaphh7e1yyabio.webp'),
        'Marron caramel': coat('v1791676629/malaksit-landing/trenchcoat/rfj3nnrhzqlo0ztepzba.webp'),
        Taupe: coat('v1791676632/malaksit-landing/trenchcoat/hqjnyy42qansbco2tprj.webp'),
        'Beige sable': coat('v1791676630/malaksit-landing/trenchcoat/obvquhivgcdodzq1heak.webp'),
        'Marron chocolat': coat('v1791676625/malaksit-landing/trenchcoat/fnulzusb5be2mowzzzno.webp'),
        Ivoire: coat('v1791676626/malaksit-landing/trenchcoat/zlvr40zyfhuji8et8xab.webp'),
        'Vert kaki clair': coat('v1791676631/malaksit-landing/trenchcoat/fhmx6bdqdqmwmee76xwk.webp'),
        Noir: coat('v1791676627/malaksit-landing/trenchcoat/sjtyfxxiq7x4ndylgx4y.webp'),
    },
    // Colours that are finished: shown so she sees what the shop sells, never orderable
    soldOutColors: [],
    inStockLabel: 'متوفر',
    soldOutLabel: 'نفذت الكمية',

    // One size only, so this section explains the fit instead of listing sizes
    sizesTitle: 'المقاس',
    sizeStandard: 'تايل ستاندار',
    sizesNote: 'يناسب من 38 إلى 44 — القصة واسعة (oversize) وتتلبس مرتاحة فوق أي إطلالة.',

    galleryTitle: 'الألوان الثمانية',
    gallery: [],

    formTitle: 'أكملي طلبك الآن',
    formSubtitle: 'الدفع عند الاستلام، في جميع ولايات الجزائر',
    formNote: 'ما تخلصيش حتى توصلك السلعة',

    faqTitle: 'أسئلة شائعة',
    faq: [
        { q: 'كيفاش نخلص؟', a: 'تخلصي كاش لعامل التوصيل كي توصلك السلعة. ما تخلصي والو قبل.' },
        { q: 'قداش ياخذ التوصيل؟', a: 'من 24 إلى 48 ساعة، لباب الدار ولا لمكتب ZR Express اللي تختاريه.' },
        { q: 'قداش سعر التوصيل؟', a: 'يبان في الاستمارة كي تختاري الولاية والبلدية، بالسعر الحقيقي تاع ZR Express.' },
        {
            q: 'واش يعني تايل ستاندار؟',
            a: 'المعطف يجي بمقاس واحد، قصتو واسعة (oversize) ويناسب من 38 إلى 44. ما تحتاجيش تختاري مقاس.',
        },
        {
            q: 'إذا ما جانيش؟',
            a: 'نبدلوه لك بلون آخر وتخلصي غير مصاريف التوصيل. وباش ما يصراش، نتصلو بيك قبل ما نبعثو الطلب.',
        },
        { q: 'واش هي الألوان المتوفرة؟', a: '8 ألوان: Beige Clair، Marron Caramel، Taupe، Beige Sable، Marron Chocolat، Ivoire، Vert Kaki Clair و Noir.' },
    ],

    tagline: 'بلوزات أنيقة لكل الجزائريات',
};
