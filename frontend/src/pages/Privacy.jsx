import React from 'react';
import { Link } from 'react-router-dom';
import { SHOP_PHONE } from '../lib/shop';



const Section = ({ title, children }) => (
    <section className="space-y-2">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
);

// Short privacy notice linked under the order button
const Privacy = () => (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
        <article className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">سياسة الخصوصية</h1>
            <p className="text-gray-600">نحترم خصوصيتك. توضح هذه الصفحة باختصار ما نفعله بمعلوماتك عندما تطلب من متجرنا.</p>

            <Section title="ما الذي نجمعه">
                <p>عند الطلب: الاسم، رقم الهاتف، الولاية والبلدية، العنوان أو مكتب الاستلام، والمنتج الذي اخترته.</p>
                <p>معلومات تقنية: عنوان IP، نوع المتصفح، ومعرّفات إعلانات Meta المحفوظة في متصفحك.</p>
            </Section>

            <Section title="لماذا نستعملها">
                <ul className="list-disc pr-5 space-y-1">
                    <li>لتأكيد طلبك عبر الهاتف وتوصيله إليك.</li>
                    <li>لقياس فعالية إعلاناتنا على فيسبوك وإنستغرام وتحسينها.</li>
                </ul>
            </Section>

            <Section title="مع من نشاركها">
                <ul className="list-disc pr-5 space-y-1">
                    <li><b>ZR Express</b>: الاسم ورقم الهاتف والعنوان، لتوصيل الطرد.</li>
                    <li><b>Meta</b> (فيسبوك وإنستغرام): رقم الهاتف والاسم والبلدية تُرسل <b>مشفّرة</b> (غير قابلة للقراءة) مع المعلومات التقنية، لمعرفة الإعلانات التي أدّت إلى الطلبات.</li>
                    <li>لا نبيع معلوماتك لأي جهة.</li>
                </ul>
            </Section>

            <Section title="كم نحتفظ بها">
                <p>نحتفظ بمعلومات الطلب لمتابعة التوصيل والحسابات. تُحذف المعلومات التقنية بعد نحو 30 يوماً من انتهاء الطلب.</p>
            </Section>

            <Section title="حقوقك">
                <p>
                    يمكنك طلب الاطلاع على معلوماتك أو تصحيحها أو حذفها بالاتصال بنا على{' '}
                    <a href={`tel:${SHOP_PHONE}`} dir="ltr" className="font-semibold text-pink-600">{SHOP_PHONE}</a>.
                </p>
            </Section>

            <Link to="/" className="inline-block text-pink-600 font-semibold">العودة إلى المتجر</Link>
        </article>
    </main>
);

export default Privacy;
