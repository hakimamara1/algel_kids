// Every text and photo of the "blouse" landing page (Angels closet — بلوزة Plissé).
// Change them here to test another message.

export { SHOP_PHONE, FACEBOOK_PAGE } from '../../lib/shop';

// Photos uploaded to Cloudinary (folder malaksit-landing/blouse)
const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photo = (path) => `${CLD}/${path}`;

export const images = {
    logo: photo('v1789924693/malaksit-landing/blouse/dtaqu1hkmrcwoupgblfn.png'),
    hero: photo('v1789924696/malaksit-landing/blouse/wxtevtgfsbnpgiwikl17.png'),
};

export const content = {
    brand: 'Angels closet',
    // Shown in the browser tab, and the order the colors appear in
    pageTitle: 'بلوزة Plissé',
    defaultColorName: 'Rose',
    colorOrder: ['Rose', 'Bleu ciel'],
    title: 'بلوزة Plissé — أناقة من الجامعة للخرجة',
    subtitle: 'قماش خفيف + أكمام واسعة + ياقة بربطة — 4 مقاسات',
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

    // Color names as saved on the product -> how the page shows them
    colorLabels: {
        Rose: 'Rose Fuchsia',
        'Bleu ciel': 'Bleu Ciel',
    },
    colorsTitle: 'الألوان المتوفرة',
    colorPhotos: {
        Rose: photo('v1789924699/malaksit-landing/blouse/t5li0ixxwxgcnrz6npl7.png'),
        'Bleu ciel': photo('v1789924702/malaksit-landing/blouse/kb07koikcm3uthnj1k0m.png'),
    },
    // Colors that are finished: shown so she sees what the shop sells, never orderable
    soldOutColors: [
        { label: 'Rose Clair', image: photo('v1789924705/malaksit-landing/blouse/t5xhadsomqh6w4nqbiwv.png') },
        { label: 'Orange', image: photo('v1789924708/malaksit-landing/blouse/yi41rwijuvcfg9j8xmnq.png') },
    ],
    inStockLabel: 'متوفر',
    soldOutLabel: 'نفذت الكمية',

    sizesTitle: 'المقاسات المتوفرة',
    sizesNote: 'اختاري مقاسك عند إتمام الطلب',

    stylingTitle: 'كيف يمكنكِ تنسيقها؟',
    stylingIntro: 'قطعة واحدة… وإطلالات مختلفة لكل يوم.',
    styling: [
        {
            title: 'للجامعة',
            text: 'إطلالة مريحة ومرتبة تناسب يومك الدراسي من الصباح حتى المساء.',
            with: ['بنطلون واسع أبيض', 'حجاب بسيط', 'حقيبة يومية'],
            image: photo('v1789924713/malaksit-landing/blouse/vv4mqhtpqsremuybrzdr.png'),
        },
        {
            title: 'للخرجات والكافيهات',
            text: 'إطلالة كاجوال أنيقة وناعمة مع صديقاتك.',
            with: ['جينز فاتح', 'حقيبة صغيرة', 'إكسسوارات ناعمة'],
            image: photo('v1789924719/malaksit-landing/blouse/rf61j4ccvmyur2eijyb2.png'),
        },
        {
            title: 'للتسوق والمشاوير',
            text: 'قصة فضفاضة وخفيفة تمنحك حرية الحركة أثناء يومك.',
            with: ['بنطلون واسع مريح', 'حذاء مريح', 'حقيبة عملية'],
            image: photo('v1789924724/malaksit-landing/blouse/qmgo00ehca7rebhfa5rj.png'),
        },
        {
            title: 'للزيارات والمناسبات البسيطة',
            text: 'لمسة بسيطة من الإكسسوارات تمنحك إطلالة أكثر أناقة.',
            with: ['بنطلون نيوترال', 'حقيبة صغيرة', 'ساعة أو ذهب خفيف'],
            image: photo('v1789924730/malaksit-landing/blouse/wssvsglkgmef9emrto7i.png'),
        },
    ],

    galleryTitle: 'من إطلالات Angels closet',
    gallery: [
        photo('v1789924733/malaksit-landing/blouse/exljtpl3cxomfdjfg4uq.png'),
        photo('v1789924736/malaksit-landing/blouse/jd9lvb6yhuvnrlo5jezi.png'),
        photo('v1789924740/malaksit-landing/blouse/foln5ntybuhk8so0vz8f.png'),
    ],

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
            a: 'بلوزة Plissé بأكمام واسعة وياقة بربطة، في المقاس اللي تختاري (38 / 40 / 42 / 44). متوفر دروك: Rose Fuchsia و Bleu Ciel — Rose Clair و Orange نفدو.',
        },
    ],

    tagline: 'بلوزات أنيقة لكل الجزائريات',
};
