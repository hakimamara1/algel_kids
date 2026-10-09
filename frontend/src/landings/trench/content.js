// Every text and photo of the "trench" landing page (Angels closet — Ensemble Trench).
// Change them here to test another message.

export { SHOP_PHONE, FACEBOOK_PAGE } from '../../lib/shop';

// Photos uploaded to Cloudinary (folder malaksit-landing/trench)
const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photo = (path) => `${CLD}/${path}`;

export const images = {
    logo: photo('v1789924693/malaksit-landing/blouse/dtaqu1hkmrcwoupgblfn.png'),
    // Also the product's photo in the database, so index.html preloads the file the page shows
    hero: photo('v1791587640/malaksit-landing/trench/rpj9tefm4rfpguaygspp.jpg'),
};

export const content = {
    brand: 'Angels closet',
    // Shown in the browser tab, and the order the colors appear in
    pageTitle: 'Ensemble Trench',
    defaultColorName: 'Beige',
    colorOrder: ['Beige', 'Noir', 'Bleu ciel'],
    title: 'Ensemble Trench — راحة وأناقة في طقم واحد',
    subtitle: 'سويت شيرت + سروال واسع — قماش شتوي دافئ، 3 ألوان',
    priceNote: 'للطقم الكامل (سويت شيرت + سروال)',
    cta: 'اطلبي الآن — الدفع عند الاستلام',
    deliveryNote: 'توصيل إلى جميع ولايات الوطن',

    // The pack chosen when the page opens
    defaultPack: 1,
    packs: [
        { quantity: 1, label: 'طقم واحد' },
        { quantity: 2, label: 'طقمين' },
    ],
    offersTitle: 'عروض خاصة',
    offersCta: 'أكملي طلبك',

    // Color names as saved on the product -> how the page shows them
    colorLabels: {
        Beige: 'Beige',
        Noir: 'Noir',
        'Bleu ciel': 'Bleu Ciel',
    },
    colorsTitle: 'الألوان المتوفرة',
    colorPhotos: {
        Beige: photo('v1791587640/malaksit-landing/trench/rpj9tefm4rfpguaygspp.jpg'),
        Noir: photo('v1791587642/malaksit-landing/trench/aobjppwymctqzksrm3vv.jpg'),
        'Bleu ciel': photo('v1791587643/malaksit-landing/trench/w4rfbg65yid8auowm8rn.jpg'),
    },
    // Colors that are finished: shown so she sees what the shop sells, never orderable
    soldOutColors: [],
    inStockLabel: 'متوفر',
    soldOutLabel: 'نفذت الكمية',

    sizesTitle: 'المقاسات المتوفرة',
    sizesNote: 'اختاري مقاسك عند إتمام الطلب',

    stylingTitle: 'كيفاش تلبسيه؟',
    stylingIntro: 'نفس الطقم… وثلاث إطلالات حسب اللون اللي تختاري.',
    styling: [
        {
            title: 'البيج — لنهارك العادي',
            text: 'لون هادئ يمشي مع كل شي: للجامعة، للتسوق، ولا غير مشوار قريب.',
            with: ['حذاء رياضي أبيض', 'حقيبة صغيرة سوداء', 'كاسكيط'],
            image: photo('v1791587641/malaksit-landing/trench/ljwcf9gqnspyxaatcpqz.jpg'),
        },
        {
            title: 'الأسود — الكلاسيك اللي ما يغلطش',
            text: 'يبان مرتب في أي وقت، ويتماشى مع أي لون تزيديه فوقه.',
            with: ['شال بنقشة النمر', 'حذاء أبيض', 'ساعة بسيطة'],
            image: photo('v1791587639/malaksit-landing/trench/lmjybzvyyjox4nebumzb.jpg'),
        },
        {
            title: 'البلو سيال — لمسة مختلفة',
            text: 'لون فاتح وهادئ يخرجك من الأسود والبيج، ويبان نقي مع إكسسوار داكن.',
            with: ['شال بنقشة النمر', 'كاسكيط أسود', 'حذاء رياضي'],
            image: photo('v1791588399/malaksit-landing/trench/umwmh8dhkp9eb6zkbz61.webp'),
        },
    ],

    galleryTitle: 'من إطلالات Angels closet',
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
            q: 'إذا المقاس ما جاش؟',
            a: 'نبدلوه لك بمقاس آخر وتخلصي غير مصاريف التوصيل. وباش ما يصراش، نتصلو بيك قبل ما نبعثو الطلب ونتأكدو من المقاس معاك.',
        },
        {
            q: 'واش كاين في الطلبية؟',
            a: 'طقم كامل: سويت شيرت بقبعة + سروال واسع، بنفس اللون والمقاس اللي تختاري (38 / 40 / 42 / 44 / 46). الكاسكيط والحقيبة والشال اللي في الصور ماشي داخلين في الطلبية.',
        },
        { q: 'واش هي الألوان المتوفرة؟', a: 'ثلاث ألوان: Beige و Noir و Bleu Ciel.' },
    ],

    tagline: 'بلوزات أنيقة لكل الجزائريات',
};
