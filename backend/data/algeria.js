// Wilaya codes/names and delivery prices used to price orders on the server.
// Generated from frontend/src/data/algeriaData.js — keep both in sync:
// the shop shows these prices, the server charges them.
const WILAYAS = [
    { code: "01", name: "أدرار" },
    { code: "02", name: "الشلف" },
    { code: "03", name: "الأغواط" },
    { code: "04", name: "أم البواقي" },
    { code: "05", name: "باتنة" },
    { code: "06", name: "بجاية" },
    { code: "07", name: "بسكرة" },
    { code: "08", name: "بشار" },
    { code: "09", name: "البليدة" },
    { code: "10", name: "البويرة" },
    { code: "11", name: "تمنراست" },
    { code: "12", name: "تبسة" },
    { code: "13", name: "تلمسان" },
    { code: "14", name: "تيارت" },
    { code: "15", name: "تيزي وزو" },
    { code: "16", name: "الجزائر" },
    { code: "17", name: "الجلفة" },
    { code: "18", name: "جيجل" },
    { code: "19", name: "سطيف" },
    { code: "20", name: "سعيدة" },
    { code: "21", name: "سكيكدة" },
    { code: "22", name: "سيدي بلعباس" },
    { code: "23", name: "عنابة" },
    { code: "24", name: "قالمة" },
    { code: "25", name: "قسنطينة" },
    { code: "26", name: "المدية" },
    { code: "27", name: "مستغانم" },
    { code: "28", name: "المسيلة" },
    { code: "29", name: "معسكر" },
    { code: "30", name: "ورقلة" },
    { code: "31", name: "وهران" },
    { code: "32", name: "البيض" },
    { code: "33", name: "إليزي" },
    { code: "34", name: "برج بوعريريج" },
    { code: "35", name: "بومرداس" },
    { code: "36", name: "الطارف" },
    { code: "37", name: "تندوف" },
    { code: "38", name: "تيسمسيلت" },
    { code: "39", name: "الوادي" },
    { code: "40", name: "خنشلة" },
    { code: "41", name: "سوق أهراس" },
    { code: "42", name: "تيبازة" },
    { code: "43", name: "ميلة" },
    { code: "44", name: "عين الدفلى" },
    { code: "45", name: "النعامة" },
    { code: "46", name: "عين تموشنت" },
    { code: "47", name: "غرداية" },
    { code: "48", name: "غليزان" },
    { code: "49", name: "تيميمون" },
    { code: "50", name: "برج باجي مختار" },
    { code: "51", name: "أولاد جلال" },
    { code: "52", name: "بني عباس" },
    { code: "53", name: "إن صالح" },
    { code: "54", name: "إن قزام" },
    { code: "55", name: "تقرت" },
    { code: "56", name: "جانِت" },
    { code: "57", name: "المغير" },
    { code: "58", name: "المنيعة" },
];

const SHIPPING_RATES = {
    "16": {
        home: 400,
        desk: 0
    },
    "25": {
        home: 500,
        desk: 0
    },
    "31": {
        home: 500,
        desk: 0
    },
    default: {
        home: 600,
        desk: 0
    },
    south: {
        home: 900,
        desk: 0
    }
};

// Remote/south wilayas pay the "south" rate
const SOUTH_CODES = ["01", "03", "08", "11", "30", "32", "33", "37", "39", "45", "47", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58"];

const byCode = new Map(WILAYAS.map((wilaya) => [wilaya.code, wilaya]));
const byName = new Map(WILAYAS.map((wilaya) => [wilaya.name, wilaya]));

// The shop sends the Arabic name; codes ("16" or "9") are accepted too
const findWilaya = (value) => {
    const text = String(value ?? "").trim();
    return byName.get(text) || byCode.get(text.padStart(2, "0")) || null;
};

const getShippingRate = (code) => {
    if (SOUTH_CODES.includes(code)) return SHIPPING_RATES.south;
    return SHIPPING_RATES[code] || SHIPPING_RATES.default;
};

module.exports = { WILAYAS, SHIPPING_RATES, findWilaya, getShippingRate };
