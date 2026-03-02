# نظام مركز البيانات المركزي العابر للحدود وسجل الائتمان الإصدار 1.2 — وثائق النظام

**مُعد لصالح:** Systems In Motion Limited  
**إصدار الوثيقة:** 1.2  
**التاريخ:** مارس 2026  
**التصنيف:** سري

---

## جدول المحتويات

1. [الملخص التنفيذي](#1-الملخص-التنفيذي)
2. [بنية النظام](#2-بنية-النظام)
3. [مكدس التكنولوجيا](#3-مكدس-التكنولوجيا)
4. [نموذج البيانات](#4-نموذج-البيانات)
5. [كتالوج نقاط نهاية API](#5-كتالوج-نقاط-نهاية-api)
6. [بنية الأمان](#6-بنية-الأمان)
7. [بنية النشر](#7-بنية-النشر)
8. [نقاط التكامل](#8-نقاط-التكامل)
9. [مخططات تدفق البيانات](#9-مخططات-تدفق-البيانات)
10. [معالجة الأخطاء](#10-معالجة-الأخطاء)
11. [الأداء](#11-الأداء)
12. [المراقبة والتسجيل](#12-المراقبة-والتسجيل)

---

## 1. الملخص التنفيذي

### 1.1 الغرض من النظام

نظام مركز البيانات المركزي العابر للحدود وسجل الائتمان هو منصة قائمة على الويب طورتها شركة Systems In Motion Limited لإدارة معلومات الائتمان وسجلات المقترضين وتقييم المخاطر الائتمانية عبر البنوك التجارية ومؤسسات التمويل الأصغر ومقدمي الخدمات المالية الآخرين. يُتيح النظام جمع بيانات الائتمان المركزية ومشاركتها وإعداد التقارير لدعم قرارات الإقراض السليمة والرقابة التنظيمية.

### 1.2 الاختصاصات القضائية المشمولة

صُمم النظام للنشر على مستوى أفريقيا عبر جميع الدول الأفريقية الـ 54، منظمة في خمس تكتلات اقتصادية إقليمية:

- **ECOWAS (المجموعة الاقتصادية لدول غرب أفريقيا)** — غانا، نيجيريا، السنغال، كوت ديفوار، سيراليون، ليبيريا، غينيا، مالي، بوركينا فاسو، النيجر، توغو، بنين، غامبيا، غينيا بيساو، الرأس الأخضر
- **EAC (مجموعة شرق أفريقيا)** — كينيا، أوغندا، تنزانيا، رواندا، بوروندي، جنوب السودان، جمهورية الكونغو الديمقراطية
- **SADC (مجموعة التنمية لأفريقيا الجنوبية)** — جنوب أفريقيا، موزمبيق، زامبيا، زيمبابوي، بوتسوانا، ناميبيا، أنغولا، ملاوي، مدغشقر، موريشيوس، إسواتيني، ليسوتو، سيشل، جزر القمر
- **CEMAC (المجموعة الاقتصادية والنقدية لوسط أفريقيا)** — الكاميرون، الغابون، تشاد، جمهورية أفريقيا الوسطى، جمهورية الكونغو، غينيا الاستوائية
- **AMU (اتحاد المغرب العربي)** — المغرب، الجزائر، تونس، ليبيا، موريتانيا، مصر، السودان، إريتريا، إثيوبيا، جيبوتي، الصومال

### 1.3 القدرات الرئيسية

- **إدارة المقترضين** — تسجيل المقترضين الأفراد والشركات مع وسم الأشخاص المعرضين سياسياً (PEP)، وتتبع التعليم/التوظيف، وربط الأطراف ذات الصلة (7 أنواع بما في ذلك beneficial_owner)
- **إدارة الحسابات الائتمانية** — تتبع القروض متعددة العملات مع دعم القروض بدون فوائد، وفترات السماح، وإعادة الهيكلة، وإدارة الشطب
- **التسجيل الائتماني** — تسجيل خوارزمي (نطاق 300-850) مع رموز الأسباب
- **التقارير الائتمانية** — تقارير ائتمانية كاملة قابلة للطباعة بأرقام تسلسلية، وسجل المدفوعات، وأحكام المحاكم، وسجلات الموافقة
- **سير عمل صانع-مراجع** — مبدأ العيون الأربع للموافقة على تغييرات البيانات مع منع الموافقة الذاتية
- **إدارة النزاعات** — حل النزاعات المتتبع باتفاقية مستوى الخدمة (يومان مالي، 5 أيام غير مالي)
- **أحكام المحاكم** — تتبع الامتيازات والإفلاسات والدعاوى والأحكام المدنية/الجنائية
- **إدارة الموافقات** — موافقة صاحب البيانات بأرقام إيصالات وإمكانية الإلغاء
- **إدارة المؤسسات** — تسجيل مزودي البيانات مع سير عمل الموافقة
- **الفوترة** — إدارة الفواتير وتتبع الرسوم لمزودي البيانات
- **الرفع الدفعي** — استيعاب البيانات بالجملة بتنسيق JSON/CSV مع التحقق لكل سجل
- **واجهة REST API الخارجية** — وصول برمجي للمؤسسات بمصادقة مفاتيح API
- **التحليلات التنظيمية** — نسب القروض المتعثرة، وتفاصيل المحفظة، وتتبع انتهاكات اتفاقية مستوى الخدمة، وتصدير CSV
- **التدويل** — دعم كامل للغات الإنجليزية والفرنسية والبرتغالية
- **العملات المتعددة** — دعم أكثر من 42 عملة أفريقية بالإضافة إلى USD وEUR وGBP
- **إدارة أسعار الصرف** — أكثر من 42 عملة مع جلب الأسعار الحية عبر open.er-api.com، وتحويل الأسعار المتقاطعة عبر توجيه USD، وعمليات إدارة CRUD، وأداة تحويل العملات
- **إدارة API** — إدارة مركزية لتكوين API الخارجي مع اختبار الاتصال، وإعدادات لكل دولة، وحماية SSRF
- **سياسات الاحتفاظ بالبيانات** — فترات احتفاظ حسب الاختصاص القضائي مع جدولة تنفيذ تلقائي (فاصل 24 ساعة) ومشغل يدوي
- **البحث الشامل** — بحث عبر الكيانات في المقترضين والمؤسسات والحسابات الائتمانية في آن واحد عبر `/api/global-search` مع تصفية حسب الدولة
- **صور الهوية والوثائق** — صور رمزية تلقائية عبر DiceBear لملفات المقترضين الشخصية، ورفع الصور ووثائق الهوية عبر multer مع خدمة محمية بالمصادقة من `/uploads`
- **بيئة العرض التوضيحي** — عرض توضيحي بنقرة واحدة موجه للمستثمرين مع ثلاث بطاقات أدوار (مدير، منظم، موظف بنك)، وشريط بيئة العرض التوضيحي باللون الكهرماني، وإخلاء مسؤولية البيانات الخيالية
- **سجل التدقيق** — تسجيل شامل للنشاط مع تتبع IP وسلسلة تجزئة SHA-256 مقاومة للتلاعب
- **المصادقة متعددة العوامل** — MFA قائم على TOTP عبر مكتبة otpauth
- **المطابقة الضبابية للكيانات** — تشابه المثلثات pg_trgm في PostgreSQL للكشف عن المقترضين المكررين
- **روبوت النزاعات** — مساعد محادثة موجه متعدد الخطوات لتقديم النزاعات
- **OAuth 2.1** — مصادقة رمز الحامل (منحة client_credentials) لـ API الخارجي
- **تحسين النطاق الترددي المنخفض** — ضغط gzip وتقسيم الشفرة عبر React.lazy
- **رفع XBRL** — دعم تنسيق ملفات XBRL/XML للرفع الدفعي للبيانات

---

## 2. بنية النظام

### 2.1 البنية عالية المستوى

يتبع النظام بنية أحادية حديثة كاملة المكدس مع فصل واضح بين الواجهة الأمامية (SPA) والواجهة الخلفية (REST API) وطبقات قاعدة البيانات. يتم نشر جميع المكونات كوحدة تطبيق واحدة.

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│  ┌───────────────────────────────────────────────────┐   │
│  │          React SPA (Vite + TypeScript)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │   │
│  │  │  wouter   │  │ TanStack │  │  react-i18next │   │   │
│  │  │ (routing) │  │  Query   │  │   (EN / FR / PT) │   │   │
│  │  └──────────┘  └──────────┘  └───────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │        shadcn/ui + Tailwind CSS              │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (JSON)
┌──────────────────────────▼──────────────────────────────┐
│                  Express.js Server                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Session Auth │  │   Internal   │  │  External    │   │
│  │  (memorystore)│  │   API Routes │  │  API (v1)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Zod        │  │   RBAC       │  │  Audit       │   │
│  │  Validation  │  │  Middleware   │  │  Logging     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Storage Interface (IStorage)            │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ SQL (pg driver)
┌──────────────────────────▼──────────────────────────────┐
│              PostgreSQL Database (Neon)                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Drizzle ORM (21 tables)               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 بنية الواجهة الأمامية

- **الإطار:** React مع TypeScript
- **أداة البناء:** Vite مع HMR (استبدال الوحدات الساخن) في بيئة التطوير
- **التنسيق:** Tailwind CSS مع مكتبة مكونات shadcn/ui
- **التوجيه:** wouter — توجيه خفيف الوزن من جانب العميل
- **إدارة الحالة:** TanStack Query v5 لإدارة حالة الخادم مع التخزين المؤقت والإبطال
- **التدويل:** react-i18next مع i18next-browser-languagedetector لـ EN/FR/PT
- **السمة:** وضع داكن/فاتح مع خصائص CSS المخصصة وتبديل الفئات في Tailwind
- **الخط:** Inter (Google Fonts)
- **نظام التصميم:** لوحة ألوان أزرق مخضر دافئ + ذهبي (ملائمة ثقافياً للنشر في جميع أنحاء أفريقيا عبر 54 دولة)

### 2.3 بنية الواجهة الخلفية

- **بيئة التشغيل:** Node.js مع TypeScript
- **الإطار:** خادم Express.js REST API
- **المصادقة:** مصادقة قائمة على الجلسات مع express-session وmemorystore
- **تجزئة كلمات المرور:** bcryptjs مع 10 جولات ملح
- **التحقق:** مخططات Zod المشتقة من تعريفات جداول Drizzle عبر drizzle-zod
- **نمط التخزين:** طبقة تخزين قائمة على الواجهة (`IStorage`) مع تطبيق `DatabaseStorage`

### 2.4 بنية قاعدة البيانات

- **المحرك:** PostgreSQL (مستضاف على Neon)
- **ORM:** Drizzle ORM مع drizzle-zod لتوليد التحقق من المخطط
- **المشغل:** pg (node-postgres) مع تجميع الاتصالات
- **إدارة المخطط:** drizzle-kit لدفع المخطط (التطوير)، SQL مباشر لعمليات الترحيل في الإنتاج
- **تجمع الاتصالات:** محدود بـ 2 اتصالات لكفاءة الموارد، مهلة خمول 30 ثانية

### 2.5 بنية المصادقة

- **الطريقة:** تجزئة كلمات المرور عبر bcryptjs مع 10 جولات ملح
- **مخزن الجلسات:** memorystore (وليس PostgreSQL) لتقليل الضغط على الذاكرة
- **تكوين الجلسة:**
  - عمر جلسة أقصى 8 ساعات (maxAge لملف تعريف الارتباط)
  - مهلة خمول 15 دقيقة مع تدمير تلقائي للجلسة (NFR-SEC-09)
  - ملفات تعريف ارتباط HTTP-only، SameSite=Lax
- **القفل:** 3 محاولات تسجيل دخول فاشلة تؤدي إلى قفل الحساب لمدة 15 دقيقة

### 2.6 التدويل

- **المكتبة:** react-i18next + i18next-browser-languagedetector
- **اللغات:** الإنجليزية (en)، الفرنسية (fr)، البرتغالية (pt)
- **مصدر الترجمة:** موارد JSON مضمنة في `client/src/lib/i18n.ts`
- **الاكتشاف:** اكتشاف تلقائي للغة المتصفح مع حفظ مستمر في localStorage؛ مبدل يدوي متاح في صفحة تسجيل الدخول والرأس الرئيسي

### 2.7 التوجيه

- **جانب العميل:** wouter — موجه React خفيف الوزن مع `<Switch>`، `<Route>`، `<Link>`، وخطاف `useLocation`
- **جانب الخادم:** موجه Express.js مع سلسلة البرمجيات الوسيطة (التحقق من الجلسة، RBAC، التحقق من الصحة)

---

## 3. مكدس التكنولوجيا

| الطبقة | التكنولوجيا | الإصدار | الغرض |
|--------|------------|---------|-------|
| **إطار الواجهة الأمامية** | React | 18.x | إطار مكونات واجهة المستخدم |
| **اللغة** | TypeScript | 5.x | JavaScript آمن الأنواع |
| **أداة البناء** | Vite | 5.x | بناء الواجهة الأمامية وخادم تطوير HMR |
| **إطار CSS** | Tailwind CSS | 3.x | CSS قائم على الأدوات المساعدة |
| **مكتبة المكونات** | shadcn/ui | الأحدث | مكونات واجهة مستخدم مبنية مسبقاً وسهلة الوصول |
| **توجيه العميل** | wouter | 3.x | موجه React خفيف الوزن |
| **حالة الخادم** | TanStack Query | 5.x | جلب البيانات، التخزين المؤقت، المزامنة |
| **النماذج** | react-hook-form | 7.x | إدارة حالة النماذج |
| **التحقق من النماذج** | @hookform/resolvers/zod | الأحدث | تحقق من النماذج قائم على Zod |
| **الأيقونات** | lucide-react | الأحدث | مكتبة الأيقونات |
| **التدويل** | react-i18next | الأحدث | التدويل |
| **إطار الخادم** | Express.js | 4.x | خادم HTTP وتوجيه API |
| **قاعدة البيانات** | PostgreSQL | 16.x | قاعدة بيانات علائقية (مستضافة على Neon) |
| **ORM** | Drizzle ORM | الأحدث | منشئ استعلامات SQL آمن الأنواع |
| **التحقق من المخطط** | Zod + drizzle-zod | الأحدث | تحقق وقت التشغيل من مخطط قاعدة البيانات |
| **تجزئة كلمات المرور** | bcryptjs | 2.x | تجزئة آمنة لكلمات المرور |
| **إدارة الجلسات** | express-session | 1.x | معالجة الجلسات من جانب الخادم |
| **مخزن الجلسات** | memorystore | 1.x | تخزين الجلسات في الذاكرة |
| **مشغل قاعدة البيانات** | pg (node-postgres) | 8.x | مشغل عميل PostgreSQL |
| **حزم الخادم** | esbuild | الأحدث | تجميع TypeScript من جانب الخادم |
| **أدوات المخطط** | drizzle-kit | الأحدث | إدارة مخطط قاعدة البيانات |
| **رفع الملفات** | multer | 1.x | معالجة رفع ملفات multipart form-data |

---

## 4. نموذج البيانات

يستخدم النظام 21 جدول PostgreSQL مع Drizzle ORM للوصول الآمن من حيث الأنواع. جميع المفاتيح الأساسية هي سلاسل UUID v4 مولدة عبر `gen_random_uuid()`.

### 4.1 جدول: `users`

مستخدمو النظام مع التحكم في الوصول القائم على الأدوار، وتتبع تسجيل الدخول، وإنفاذ سياسة كلمات المرور.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف المستخدم الفريد |
| `username` | text | NOT NULL, UNIQUE | اسم المستخدم لتسجيل الدخول |
| `password` | text | NOT NULL | كلمة المرور المجزأة بـ bcrypt |
| `full_name` | text | NOT NULL | اسم العرض |
| `email` | text | NOT NULL | عنوان البريد الإلكتروني |
| `role` | enum `user_role` | NOT NULL, default `'viewer'` | أحد: `admin`، `regulator`، `lender`، `viewer` |
| `status` | enum `user_status` | NOT NULL, default `'active'` | أحد: `active`، `suspended`، `deactivated` |
| `institution` | text | nullable | اسم المؤسسة المرتبطة |
| `failed_login_attempts` | integer | default `0` | عدد محاولات تسجيل الدخول الفاشلة المتتالية |
| `locked_until` | timestamp | nullable | وقت انتهاء قفل الحساب |
| `last_login` | timestamp | nullable | طابع زمني لآخر تسجيل دخول ناجح |
| `password_changed_at` | timestamp | nullable | طابع زمني لآخر تغيير لكلمة المرور (انتهاء الصلاحية 90 يوماً) |
| `must_change_password` | boolean | default `false` | فرض تغيير كلمة المرور عند تسجيل الدخول التالي |
| `mfa_secret` | varchar | nullable | سر MFA لـ TOTP (مشفر بـ base32) لتطبيق المصادقة (ENT-01) |
| `mfa_enabled` | boolean | default `false` | ما إذا كان MFA لـ TOTP مفعلاً للمستخدم (ENT-01) |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |

### 4.2 جدول: `borrowers`

سجلات المقترضين الأفراد والشركات مع بيانات التعريف والديموغرافية والتوظيف.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف المقترض الفريد |
| `type` | enum `borrower_type` | NOT NULL | أحد: `individual`، `corporate` |
| `first_name` | text | nullable | الاسم الأول للفرد |
| `last_name` | text | nullable | اسم العائلة للفرد |
| `company_name` | text | nullable | اسم الكيان المؤسسي |
| `national_id` | text | NOT NULL, UNIQUE | رقم الهوية الوطنية |
| `tin_number` | text | nullable | الرقم الضريبي (TIN) |
| `date_of_birth` | text | nullable | تاريخ الميلاد (سلسلة ISO) |
| `gender` | text | nullable | الجنس |
| `phone` | text | nullable | رقم الهاتف |
| `email` | text | nullable | عنوان البريد الإلكتروني |
| `address` | text | nullable | العنوان الفعلي |
| `city` | text | nullable | المدينة |
| `region` | text | nullable | المنطقة/الولاية |
| `employer_name` | text | nullable | صاحب العمل الحالي |
| `occupation` | text | nullable | المهنة/المسمى الوظيفي |
| `business_reg_number` | text | nullable | رقم التسجيل التجاري (للشركات) |
| `sector` | text | nullable | القطاع الصناعي |
| `is_pep` | boolean | default `false` | علامة الشخص المعرض سياسياً |
| `pep_details` | text | nullable | تفاصيل/وصف PEP |
| `related_borrower_id` | varchar | nullable | FK إلى `borrowers.id` (طرف ذو صلة) |
| `relationship_type` | text | nullable | نوع العلاقة (spouse، guarantor، director، shareholder، beneficial_owner، subsidiary، parent_company) |
| `education_level` | text | nullable | أعلى مستوى تعليمي |
| `education_institution` | text | nullable | المؤسسة التعليمية |
| `employment_history` | text | nullable | تاريخ التوظيف (JSON أو نص) |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |
| `updated_at` | timestamp | default `now()` | طابع زمني لآخر تحديث |

### 4.3 جدول: `credit_accounts`

سجلات القروض والتسهيلات الائتمانية مع دعم العملات المتعددة وميزات القروض الخاصة.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الحساب الفريد |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | المقترض المرتبط |
| `lender_institution` | text | NOT NULL | اسم مؤسسة الإقراض |
| `account_number` | text | NOT NULL | رقم الحساب/القرض |
| `account_type` | text | NOT NULL | نوع القرض (term_loan، overdraft، mortgage، إلخ) |
| `original_amount` | decimal(15,2) | NOT NULL | مبلغ القرض الأصلي |
| `current_balance` | decimal(15,2) | NOT NULL | الرصيد القائم الحالي |
| `currency` | text | NOT NULL, default `'ETB'` | رمز العملة (أكثر من 42 عملة أفريقية بالإضافة إلى USD، EUR، GBP) |
| `interest_rate` | decimal(5,2) | nullable | معدل الفائدة السنوي |
| `disbursement_date` | text | nullable | تاريخ صرف القرض |
| `maturity_date` | text | nullable | تاريخ استحقاق القرض |
| `status` | enum `account_status` | NOT NULL, default `'current'` | أحد: `current`، `delinquent`، `default`، `closed`، `restructured`، `written_off` |
| `days_in_arrears` | integer | default `0` | أيام التأخر عن السداد |
| `collateral_type` | text | nullable | وصف نوع الضمان |
| `collateral_value` | decimal(15,2) | nullable | قيمة الضمان |
| `last_payment_date` | text | nullable | تاريخ آخر دفعة |
| `last_payment_amount` | decimal(15,2) | nullable | مبلغ آخر دفعة |
| `is_interest_free` | boolean | default `false` | علامة القرض بدون فائدة (إسلامي/شرعي) (FR-SPEC-03) |
| `grace_period_months` | integer | nullable | فترة السماح بالأشهر (FR-SPEC-04) |
| `restructure_count` | integer | default `0` | عدد عمليات إعادة الهيكلة (FR-SPEC-05) |
| `written_off_date` | text | nullable | تاريخ شطب الحساب |
| `reinstated_date` | text | nullable | تاريخ إعادة تفعيل الحساب |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |
| `updated_at` | timestamp | default `now()` | طابع زمني لآخر تحديث |

### 4.4 جدول: `credit_inquiries`

سجلات البحث والاستعلام الائتماني مع تتبع الموافقة.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الاستعلام الفريد |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | المقترض المستعلم عنه |
| `inquired_by` | varchar | NOT NULL, FK → `users.id` | المستخدم الذي أجرى الاستعلام |
| `purpose` | enum `inquiry_purpose` | NOT NULL | أحد: `new_credit`، `review`، `collection`، `regulatory`، `portfolio_monitoring` |
| `institution` | text | NOT NULL | اسم المؤسسة المستعلمة |
| `consent_provided` | boolean | NOT NULL, default `false` | ما إذا تم الحصول على موافقة المقترض |
| `created_at` | timestamp | default `now()` | طابع زمني للاستعلام |

### 4.5 جدول: `audit_logs`

تسجيل نشاط غير قابل للتغيير مع تتبع عنوان IP للأمان والامتثال.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف إدخال السجل الفريد |
| `user_id` | varchar | nullable, FK → `users.id` | المستخدم الذي نفذ الإجراء |
| `action` | text | NOT NULL | نوع الإجراء (LOGIN، CREATE، UPDATE، APPROVE، إلخ) |
| `entity` | text | NOT NULL | نوع الكيان المتأثر (user، borrower، credit_account، إلخ) |
| `entity_id` | varchar | nullable | معرف الكيان المحدد |
| `details` | text | nullable | وصف قابل للقراءة |
| `ip_address` | text | nullable | عنوان IP للعميل |
| `previous_hash` | text | nullable | تجزئة SHA-256 للإدخال السابق في سلسلة التجزئة؛ `"genesis"` للإدخال الأول (ENT-07) |
| `current_hash` | text | nullable | تجزئة SHA-256 لهذا الإدخال المحسوبة من previousHash + action + entity + details + timestamp (ENT-07) |
| `created_at` | timestamp | default `now()` | طابع زمني لإدخال السجل |

### 4.6 جدول: `pending_approvals`

سجلات سير عمل صانع-مراجع للموافقة على تغييرات البيانات.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الموافقة الفريد |
| `entity_type` | text | NOT NULL | نوع الكيان (borrower، credit_account) |
| `entity_id` | varchar | nullable | معرف الكيان الحالي (للتحديثات) |
| `action` | text | NOT NULL | نوع الإجراء (CREATE، UPDATE) |
| `payload` | text | NOT NULL | بيانات التغيير المتسلسلة بـ JSON |
| `requested_by` | varchar | NOT NULL, FK → `users.id` | المستخدم الذي قدم التغيير |
| `reviewed_by` | varchar | nullable, FK → `users.id` | المستخدم الذي راجع التغيير |
| `status` | enum `approval_status` | NOT NULL, default `'pending'` | أحد: `pending`، `approved`، `rejected` |
| `review_notes` | text | nullable | تعليقات المراجع |
| `created_at` | timestamp | default `now()` | طابع زمني للتقديم |
| `reviewed_at` | timestamp | nullable | طابع زمني للمراجعة |

### 4.7 جدول: `disputes`

إدارة النزاعات/الشكاوى مع تتبع مواعيد اتفاقية مستوى الخدمة.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف النزاع الفريد |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | المقترض المتأثر |
| `credit_account_id` | varchar | nullable, FK → `credit_accounts.id` | الحساب الائتماني المرتبط |
| `filed_by` | varchar | NOT NULL, FK → `users.id` | المستخدم الذي قدم النزاع |
| `dispute_type` | text | NOT NULL | نوع النزاع |
| `description` | text | NOT NULL | وصف النزاع |
| `status` | enum `dispute_status` | NOT NULL, default `'open'` | أحد: `open`، `under_review`، `resolved`، `rejected` |
| `resolution` | text | nullable | وصف الحل |
| `correction_type` | text | nullable | أحد: `financial`، `non_financial` |
| `sla_deadline` | timestamp | nullable | موعد اتفاقية مستوى الخدمة (يومان مالي، 5 أيام غير مالي) |
| `created_at` | timestamp | default `now()` | طابع زمني للتقديم |
| `updated_at` | timestamp | default `now()` | طابع زمني لآخر تحديث |
| `resolved_at` | timestamp | nullable | طابع زمني للحل |

### 4.8 جدول: `notifications`

نظام الإشعارات داخل التطبيق للموافقات والنزاعات وتنبيهات النظام.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الإشعار الفريد |
| `user_id` | varchar | nullable, FK → `users.id` | المستخدم المستهدف (null = بث عام) |
| `type` | text | NOT NULL | نوع الإشعار (approval_pending، approval_result، dispute_update، system) |
| `title` | text | NOT NULL | عنوان الإشعار |
| `message` | text | NOT NULL | نص الإشعار |
| `is_read` | boolean | default `false` | حالة القراءة |
| `link` | text | nullable | رابط التنقل |
| `created_at` | timestamp | default `now()` | طابع زمني للإشعار |

### 4.9 جدول: `court_judgments`

أحكام المحاكم والإفلاسات والامتيازات المرتبطة بالمقترضين (FR-COL-05).

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الحكم الفريد |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | المقترض المرتبط |
| `case_number` | text | NOT NULL | رقم القضية |
| `court` | text | NOT NULL | اسم المحكمة |
| `judgment_type` | enum `judgment_type` | NOT NULL | أحد: `lien`، `bankruptcy`، `lawsuit`، `civil_judgment`، `criminal_conviction` |
| `amount` | decimal(15,2) | nullable | مبلغ الحكم |
| `currency` | text | default `'ETB'` | رمز العملة |
| `judgment_date` | text | NOT NULL | تاريخ الحكم |
| `status` | enum `judgment_status` | NOT NULL, default `'active'` | أحد: `active`، `resolved`، `appealed` |
| `description` | text | nullable | تفاصيل الحكم |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |

### 4.10 جدول: `consent_records`

إدارة موافقة صاحب البيانات مع أرقام الإيصالات (FR-CON-06/07).

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الموافقة الفريد |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | المقترض الموافق |
| `granted_to` | text | NOT NULL | الجهة الممنوحة لها الموافقة |
| `purpose` | text | NOT NULL | غرض الموافقة |
| `consent_type` | text | NOT NULL | نوع الموافقة |
| `status` | enum `consent_status` | NOT NULL, default `'active'` | أحد: `active`، `revoked` |
| `granted_at` | timestamp | default `now()` | طابع زمني لمنح الموافقة |
| `revoked_at` | timestamp | nullable | طابع زمني للإلغاء |
| `receipt_number` | text | NOT NULL | إيصال الموافقة (التنسيق: `CR-{timestamp}-{random}`) |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |

### 4.11 جدول: `payment_history`

سجل أداء المدفوعات لـ 12 فترة لكل حساب ائتماني (FR-CR-08).

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف الإدخال الفريد |
| `credit_account_id` | varchar | NOT NULL, FK → `credit_accounts.id` | الحساب الائتماني المرتبط |
| `period` | text | NOT NULL | فترة الدفع (مثال: "2024-01") |
| `amount_due` | decimal(15,2) | NOT NULL | المبلغ المستحق للفترة |
| `amount_paid` | decimal(15,2) | NOT NULL | المبلغ المدفوع فعلياً |
| `status` | enum `payment_status` | NOT NULL, default `'on_time'` | أحد: `on_time`، `late`، `missed`، `partial` |
| `days_late` | integer | default `0` | أيام تأخر الدفع |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |

### 4.12 جدول: `institutions`

تسجيل مؤسسات مزودي البيانات وسير عمل الموافقة (FR-DP-01/04).

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف المؤسسة الفريد |
| `name` | text | NOT NULL | اسم المؤسسة |
| `type` | text | NOT NULL | أحد: `bank`، `mfi`، `utility`، `telecom`، `digital_lender`، `sacco` |
| `registration_number` | text | nullable | رقم التسجيل الرسمي |
| `country` | text | NOT NULL, default `'Ethiopia'` | دولة التشغيل |
| `contact_email` | text | nullable | البريد الإلكتروني الأساسي للتواصل |
| `contact_phone` | text | nullable | هاتف التواصل الأساسي |
| `address` | text | nullable | العنوان الفعلي |
| `status` | enum `institution_status` | NOT NULL, default `'pending'` | أحد: `pending`، `active`، `suspended` |
| `submission_frequency` | text | default `'monthly'` | تكرار تقديم البيانات |
| `approved_by` | varchar | nullable, FK → `users.id` | مستخدم المدير الموافق |
| `approved_at` | timestamp | nullable | طابع زمني للموافقة |
| `created_at` | timestamp | default `now()` | طابع زمني للتسجيل |

### 4.13 جدول: `billing_records`

إدارة الفوترة والرسوم لمؤسسات مزودي البيانات (FR-COMM-01/05).

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف سجل الفوترة الفريد |
| `institution_name` | text | NOT NULL | اسم المؤسسة المفوترة |
| `service_type` | text | NOT NULL | أحد: `data_submission`، `credit_report`، `api_access`، `subscription` |
| `amount` | decimal(15,2) | NOT NULL | مبلغ الفاتورة |
| `currency` | text | NOT NULL, default `'ETB'` | رمز العملة |
| `status` | enum `billing_status` | NOT NULL, default `'pending'` | أحد: `pending`، `paid`، `overdue` |
| `invoice_number` | text | NOT NULL | رقم مرجع الفاتورة |
| `period_start` | text | nullable | تاريخ بداية فترة الفوترة |
| `period_end` | text | nullable | تاريخ نهاية فترة الفوترة |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |

### 4.14 جدول: `credit_report_logs`

سجل تدقيق إنشاء التقارير الائتمانية بأرقام تسلسلية فريدة (FR-CR-06).

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف السجل الفريد |
| `borrower_id` | varchar | NOT NULL, FK → `borrowers.id` | المقترض المعني |
| `requested_by` | varchar | NOT NULL, FK → `users.id` | المستخدم الطالب |
| `institution` | text | NOT NULL | المؤسسة الطالبة |
| `purpose` | text | NOT NULL | غرض التقرير |
| `serial_number` | text | NOT NULL, UNIQUE | الرقم التسلسلي للتقرير (التنسيق: `CR-{YEAR}-{base36_timestamp}`) |
| `created_at` | timestamp | default `now()` | طابع زمني للإنشاء |

### 4.15 جدول: `api_keys`

إدارة مفاتيح API الخارجية مع تجزئة SHA-256 ومستويات الأذونات.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف المفتاح الفريد |
| `institution_id` | varchar | NOT NULL, FK → `institutions.id` | المؤسسة المرتبطة |
| `key_hash` | text | NOT NULL | تجزئة SHA-256 لمفتاح API الكامل |
| `key_prefix` | text | NOT NULL | أول 12 حرفاً من المفتاح (للعرض) |
| `label` | text | NOT NULL | تسمية قابلة للقراءة |
| `status` | enum `api_key_status` | NOT NULL, default `'active'` | أحد: `active`، `revoked` |
| `permissions` | text | NOT NULL, default `'submit'` | أحد: `submit`، `read`، `full` |
| `last_used_at` | timestamp | nullable | طابع زمني لآخر استخدام |
| `created_by` | varchar | NOT NULL, FK → `users.id` | المدير الذي أنشأ المفتاح |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء المفتاح |
| `revoked_at` | timestamp | nullable | طابع زمني للإلغاء |

### 4.16 جدول: `exchange_rates`

سجلات أسعار الصرف لتحويل العملات المتعددة مع توجيه الأسعار المتقاطعة عبر USD.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف السعر الفريد |
| `base_currency` | text | NOT NULL | رمز العملة الأساسية |
| `target_currency` | text | NOT NULL | رمز العملة المستهدفة |
| `rate` | decimal(15,6) | NOT NULL | قيمة سعر الصرف |
| `effective_date` | text | NOT NULL | تاريخ سريان السعر |
| `source` | text | NOT NULL, default `'manual'` | مصدر السعر (manual، api، إلخ) |
| `created_by` | varchar | nullable, FK → `users.id` | المدير الذي أدخل السعر |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |

### 4.17 جدول: `retention_policies`

تكوين سياسة الاحتفاظ بالبيانات لكل دولة للامتثال التنظيمي.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف السياسة الفريد |
| `country` | text | NOT NULL | اسم الدولة |
| `entity_type` | text | NOT NULL | نوع الكيان الخاضع للاحتفاظ |
| `retention_years` | integer | NOT NULL | عدد سنوات الاحتفاظ بالبيانات |
| `archive_after_years` | integer | nullable | السنوات التي يتم بعدها الأرشفة |
| `description` | text | nullable | وصف السياسة |
| `is_active` | boolean | default `true` | ما إذا كانت السياسة نشطة |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |
| `updated_at` | timestamp | default `now()` | طابع زمني لآخر تحديث |

### 4.18 جدول: `api_configurations`

إدارة تكوين API الخارجي المركزي لكل دولة.

| العمود | النوع | القيود | الوصف |
|--------|------|--------|-------|
| `id` | varchar | PK, default `gen_random_uuid()` | معرف التكوين الفريد |
| `name` | text | NOT NULL | اسم تكوين API |
| `category` | text | NOT NULL | فئة API (weather، judicial، payment_gateway، exchange_rate) |
| `base_url` | text | NOT NULL | عنوان URL الأساسي لـ API |
| `api_key_header_name` | text | default `'X-API-Key'` | اسم الرأس لمصادقة مفتاح API |
| `auth_type` | text | NOT NULL, default `'none'` | نوع المصادقة (none، api_key، bearer، basic) |
| `country` | text | nullable | الدولة التي ينطبق عليها هذا التكوين |
| `is_active` | boolean | default `true` | ما إذا كان التكوين نشطاً |
| `description` | text | nullable | وصف التكوين |
| `last_tested_at` | timestamp | nullable | طابع زمني لآخر اختبار اتصال |
| `last_test_status` | text | nullable | نتيجة آخر اختبار اتصال |
| `created_at` | timestamp | default `now()` | طابع زمني لإنشاء السجل |
| `updated_at` | timestamp | default `now()` | طابع زمني لآخر تحديث |

### 4.19 الأنواع المعددة

| اسم التعداد | القيم |
|-------------|-------|
| `user_role` | `admin`، `regulator`، `lender`، `viewer` |
| `user_status` | `active`، `suspended`، `deactivated` |
| `borrower_type` | `individual`، `corporate` |
| `account_status` | `current`، `delinquent`، `default`، `closed`، `restructured`، `written_off` |
| `inquiry_purpose` | `new_credit`، `review`، `collection`، `regulatory`، `portfolio_monitoring` |
| `approval_status` | `pending`، `approved`، `rejected` |
| `dispute_status` | `open`، `under_review`، `resolved`، `rejected` |
| `judgment_type` | `lien`، `bankruptcy`، `lawsuit`، `civil_judgment`، `criminal_conviction` |
| `judgment_status` | `active`، `resolved`، `appealed` |
| `consent_status` | `active`، `revoked` |
| `payment_status` | `on_time`، `late`، `missed`، `partial` |
| `institution_status` | `pending`، `active`، `suspended` |
| `billing_status` | `pending`، `paid`، `overdue` |
| `api_key_status` | `active`، `revoked` |

### 4.20 علاقات الكيانات

```
users ──────────────┐
  │                 │
  ├─→ credit_inquiries.inquired_by
  ├─→ pending_approvals.requested_by / reviewed_by
  ├─→ disputes.filed_by
  ├─→ notifications.user_id
  ├─→ credit_report_logs.requested_by
  ├─→ institutions.approved_by
  └─→ api_keys.created_by

borrowers ──────────┐
  │                 │
  ├─→ credit_accounts.borrower_id
  ├─→ credit_inquiries.borrower_id
  ├─→ disputes.borrower_id
  ├─→ court_judgments.borrower_id
  ├─→ consent_records.borrower_id
  ├─→ credit_report_logs.borrower_id
  └─→ borrowers.related_borrower_id (self-referencing)

credit_accounts ────┐
  │                 │
  ├─→ disputes.credit_account_id
  └─→ payment_history.credit_account_id

institutions ───────┐
  │                 │
  └─→ api_keys.institution_id

users ──────────────┐
  │                 │
  └─→ exchange_rates.created_by
```

---

## 5. كتالوج نقاط نهاية API

### 5.1 نقاط نهاية المصادقة (بدون مصادقة مطلوبة)

| الطريقة | المسار | الوصف | نص الطلب | الاستجابة |
|---------|--------|-------|----------|----------|
| `POST` | `/api/auth/login` | تسجيل دخول المستخدم | `{ username, password }` | كائن المستخدم + علامة `passwordExpired` |
| `POST` | `/api/auth/logout` | تسجيل خروج المستخدم | — | `{ message }` |
| `GET` | `/api/auth/me` | الحصول على المستخدم الحالي | — | كائن المستخدم + علامة `passwordExpired` |
| `POST` | `/api/auth/change-password` | تغيير كلمة المرور | `{ currentPassword, newPassword }` | `{ message }` |
| `POST` | `/api/auth/mfa/setup` | إنشاء سر TOTP لإعداد MFA (ENT-01) | — | `{ secret, uri }` |
| `POST` | `/api/auth/mfa/verify` | التحقق من رمز TOTP وتفعيل MFA (ENT-01) | `{ code }` | `{ message }` |
| `POST` | `/api/auth/mfa/disable` | تعطيل MFA للمستخدم المصادق (ENT-01) | — | `{ message }` |
| `POST` | `/api/auth/mfa/login` | إتمام تسجيل الدخول بـ MFA مع رمز TOTP (ENT-01) | `{ userId, code }` | كائن المستخدم |

### 5.2 فحص الحالة (بدون مصادقة مطلوبة)

| الطريقة | المسار | الوصف | الاستجابة |
|---------|--------|-------|----------|
| `GET` | `/api/health` | فحص حالة النظام | `{ status: "ok" }` |

### 5.3 نقاط نهاية لوحة المعلومات (مصادق عليها)

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/dashboard/stats` | أي | إحصائيات لوحة المعلومات (8 بطاقات إحصائية) |
| `GET` | `/api/dashboard/details/:type` | أي | تفاصيل معمقة (type: borrowers، accounts، outstanding، delinquent، defaults، inquiries، pending، disputes) |

### 5.4 نقاط نهاية إدارة المستخدمين (المدير فقط)

| الطريقة | المسار | الوصف | نص الطلب |
|---------|--------|-------|----------|
| `GET` | `/api/users` | سرد جميع المستخدمين | — |
| `POST` | `/api/users` | إنشاء مستخدم | مخطط InsertUser |
| `PATCH` | `/api/users/:id` | تحديث مستخدم | حقول مستخدم جزئية |

### 5.5 نقاط نهاية المقترضين (مصادق عليها)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `GET` | `/api/borrowers` | سرد المقترضين | يدعم `?search=`، `?page=`، `?limit=` (ترقيم صفحات من الخادم) |
| `GET` | `/api/borrowers/:id` | الحصول على تفاصيل المقترض | — |
| `POST` | `/api/borrowers` | تسجيل مقترض | ينشئ موافقة معلقة (صانع-مراجع) |
| `PATCH` | `/api/borrowers/:id` | تحديث مقترض | ينشئ موافقة معلقة (صانع-مراجع) |
| `GET` | `/api/borrowers/:id/related` | الحصول على المقترضين ذوي الصلة | يعيد علاقات الأصل والفرع |
| `GET` | `/api/borrowers/:id/credit-report` | تقرير ائتماني قديم | تقرير أساسي بدون رقم تسلسلي |
| `GET` | `/api/borrowers/fuzzy-match` | المطابقة الضبابية للكيانات (ENT-02) | استعلام: `?name=<search_term>`؛ يعيد المكررات المحتملة مع درجات التشابه |

### 5.6 نقاط نهاية الحسابات الائتمانية (مصادق عليها)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `GET` | `/api/credit-accounts` | سرد الحسابات | يدعم تصفية `?borrowerId=` |
| `GET` | `/api/credit-accounts/:id` | الحصول على تفاصيل الحساب | — |
| `POST` | `/api/credit-accounts` | إنشاء حساب | ينشئ موافقة معلقة (صانع-مراجع) |
| `PATCH` | `/api/credit-accounts/:id` | تحديث حساب | ينشئ موافقة معلقة (صانع-مراجع) |

### 5.7 نقاط نهاية الاستعلامات الائتمانية (مصادق عليها)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/credit-inquiries` | سرد الاستعلامات (يدعم `?borrowerId=`) |
| `POST` | `/api/credit-inquiries` | إنشاء استعلام |

### 5.8 نقاط نهاية التقارير والبحث الائتماني (مصادق عليها)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `POST` | `/api/credit-reports/generate` | إنشاء تقرير ائتماني | يعيد تقريراً كاملاً برقم تسلسلي ودرجة ورموز أسباب وسجل مدفوعات |
| `GET` | `/api/credit-reports/logs` | سجلات إنشاء التقارير | المدير/المنظم فقط |
| `POST` | `/api/credit-search/bulk` | بحث ائتماني بالجملة | النص: `{ identifiers: string[] }` |

### 5.9 نقاط نهاية صانع-مراجع (مصادق عليها)

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/pending-approvals` | أي | سرد جميع الموافقات المعلقة |
| `POST` | `/api/pending-approvals` | أي | التقديم للموافقة |
| `PATCH` | `/api/pending-approvals/:id` | المدير، المنظم | الموافقة أو الرفض (منع الموافقة الذاتية) |

### 5.10 نقاط نهاية النزاعات (مصادق عليها)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/disputes` | سرد النزاعات |
| `GET` | `/api/disputes/:id` | الحصول على تفاصيل النزاع |
| `POST` | `/api/disputes` | تقديم نزاع (يحدد موعد اتفاقية مستوى الخدمة تلقائياً) |
| `PATCH` | `/api/disputes/:id` | تحديث حالة/حل النزاع |

### 5.11 نقاط نهاية الإشعارات (مصادق عليها)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/notifications` | الحصول على إشعارات المستخدم |
| `GET` | `/api/notifications/unread-count` | الحصول على عدد غير المقروءة |
| `PATCH` | `/api/notifications/:id/read` | تعليم الإشعار كمقروء |
| `POST` | `/api/notifications/mark-all-read` | تعليم الكل كمقروء |

### 5.12 نقاط نهاية أحكام المحاكم (مصادق عليها)

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/court-judgments` | أي | سرد الأحكام (يدعم `?borrowerId=`) |
| `POST` | `/api/court-judgments` | المدير، المنظم | إنشاء حكم |

### 5.13 نقاط نهاية سجلات الموافقة (مصادق عليها)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/consent-records` | سرد السجلات (يدعم `?borrowerId=`) |
| `POST` | `/api/consent-records` | منح الموافقة (يولد رقم إيصال تلقائياً) |
| `POST` | `/api/consent-records/:id/revoke` | إلغاء الموافقة |

### 5.14 نقاط نهاية سجل المدفوعات (مصادق عليها)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/payment-history/:creditAccountId` | الحصول على سجل المدفوعات (12 فترة كحد أقصى) |
| `POST` | `/api/payment-history/:creditAccountId` | إضافة إدخال سجل مدفوعات |

### 5.15 نقاط نهاية المؤسسات (مصادق عليها)

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/institutions` | أي | سرد المؤسسات (مرقمة الصفحات) |
| `POST` | `/api/institutions` | أي | تسجيل مؤسسة |
| `PATCH` | `/api/institutions/:id` | المدير | تحديث مؤسسة |
| `POST` | `/api/institutions/:id/approve` | المدير | الموافقة على مؤسسة |

### 5.16 نقاط نهاية الفوترة

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/billing` | المدير، المنظم | سرد سجلات الفوترة |
| `POST` | `/api/billing` | المدير | إنشاء سجل فوترة |

### 5.17 نقاط نهاية الرفع الدفعي

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `POST` | `/api/batch-upload/credit-accounts` | المدير، المقرض | رفع دفعي للحسابات الائتمانية |

### 5.18 نقاط نهاية سجل التدقيق

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/audit-logs` | المدير، المنظم | سرد إدخالات سجل التدقيق (أحدث 200) |
| `GET` | `/api/audit/verify-integrity` | المدير، المنظم | التحقق من سلامة سلسلة تجزئة سجل التدقيق (ENT-07) |

### 5.19 نقاط نهاية التقارير والتصدير

| الطريقة | المسار | الدور | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/reports/export` | المدير، المنظم | تصدير CSV (`?format=csv&type=portfolio\|borrowers`) |
| `GET` | `/api/reports/regulatory` | المدير، المنظم | التحليلات التنظيمية (NPL، تفاصيل المحفظة، اتفاقية مستوى الخدمة) |

### 5.20 نقاط نهاية إدارة مفاتيح API (المدير فقط)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| `GET` | `/api/api-keys` | سرد جميع مفاتيح API مع أسماء المؤسسات |
| `POST` | `/api/api-keys` | إنشاء مفتاح API جديد |
| `POST` | `/api/api-keys/:id/revoke` | إلغاء مفتاح API |

### 5.21 نقطة نهاية رمز OAuth 2.1 (ENT-04)

| الطريقة | المسار | الوصف | نص الطلب | الاستجابة |
|---------|--------|-------|----------|----------|
| `POST` | `/api/external/oauth/token` | استبدال مفتاح API برمز حامل | `{ grant_type: "client_credentials", client_id, client_secret }` | `{ access_token, token_type: "Bearer", expires_in: 3600 }` |

### 5.22 نقاط نهاية API الخارجي (مصادقة X-API-Key أو رمز الحامل)

| الطريقة | المسار | الإذن | الوصف |
|---------|--------|------|-------|
| `GET` | `/api/external/v1/health` | لا شيء | فحص الحالة (بدون مصادقة مطلوبة) |
| `POST` | `/api/external/v1/borrowers` | submit | إنشاء مقترض(ين) — كائن فردي أو مصفوفة دفعية |
| `GET` | `/api/external/v1/borrowers/search` | read | بحث المقترضين (`?nationalId=`، `?name=`، `?q=`) |
| `GET` | `/api/external/v1/borrowers/:id/credit-report` | read | تقرير ائتماني كامل مع درجة |
| `POST` | `/api/external/v1/credit-accounts` | submit | تقديم حساب(ات) ائتماني(ة) — فردي أو دفعي |
| `GET` | `/api/external/v1/credit-accounts/:borrowerId` | read | الحصول على الحسابات حسب المقترض |
| `POST` | `/api/external/v1/payment-history` | submit | تقديم سجلات سجل المدفوعات — فردي أو دفعي |
| `POST` | `/api/external/v1/court-judgments` | submit | تقديم حكم محكمة |

**تنسيق استجابة API الخارجي:**
```json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "timestamp": "2026-02-28T00:00:00.000Z"
}
```

**تنسيق خطأ API الخارجي:**
```json
{
  "success": false,
  "error": "Error description",
  "details": "...",
  "timestamp": "2026-02-28T00:00:00.000Z"
}
```

### 5.23 نقاط نهاية أسعار الصرف (المدير فقط)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `GET` | `/api/exchange-rates` | سرد جميع أسعار الصرف | يعيد جميع سجلات الأسعار |
| `POST` | `/api/exchange-rates` | إنشاء سعر صرف | النص: مخطط InsertExchangeRate |
| `PATCH` | `/api/exchange-rates/:id` | تحديث سعر صرف | حقول سعر جزئية |
| `DELETE` | `/api/exchange-rates/:id` | حذف سعر صرف | حذف فعلي |
| `POST` | `/api/exchange-rates/convert` | التحويل بين العملات | النص: `{ from, to, amount }`؛ يستخدم السعر المتقاطع عبر توجيه USD |

### 5.24 نقاط نهاية سياسات الاحتفاظ (المدير فقط)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `GET` | `/api/retention-policies` | سرد جميع سياسات الاحتفاظ | يعيد السياسات لكل دولة |
| `POST` | `/api/retention-policies` | إنشاء سياسة احتفاظ | النص: مخطط InsertRetentionPolicy |
| `PATCH` | `/api/retention-policies/:id` | تحديث سياسة احتفاظ | حقول سياسة جزئية |
| `DELETE` | `/api/retention-policies/:id` | حذف سياسة احتفاظ | حذف فعلي |
| `POST` | `/api/retention-policies/enforce` | تشغيل تنفيذ الاحتفاظ | يشغل محرك تنفيذ الاحتفاظ يدوياً؛ يعيد النتائج المسجلة في التدقيق |

### 5.25 نقاط نهاية تكوين API (المدير فقط)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `GET` | `/api/api-configurations` | سرد جميع تكوينات API | يعيد تكوينات API لكل دولة |
| `POST` | `/api/api-configurations` | إنشاء تكوين API | النص: مخطط InsertApiConfiguration |
| `PATCH` | `/api/api-configurations/:id` | تحديث تكوين API | حقول تكوين جزئية |
| `DELETE` | `/api/api-configurations/:id` | حذف تكوين API | حذف فعلي |
| `POST` | `/api/api-configurations/:id/test` | اختبار اتصال API | يختبر الاتصال بنقطة النهاية المكونة؛ حماية SSRF مفروضة |

### 5.26 نقطة نهاية البحث الشامل (مصادق عليها)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `GET` | `/api/global-search?q=TERM&country=COUNTRY` | بحث عبر الكيانات | يبحث في المقترضين والمؤسسات والحسابات الائتمانية في آن واحد؛ يعيد نتائج مصنفة؛ تصفية اختيارية حسب الدولة |

### 5.27 نقاط نهاية رفع الصور والوثائق (مصادق عليها)

| الطريقة | المسار | الوصف | ملاحظات |
|---------|--------|-------|---------|
| `POST` | `/api/borrowers/:id/photo` | رفع صورة المقترض | `multipart/form-data` باسم حقل `photo`؛ حد أقصى 5MB؛ صور فقط؛ اسم ملف عشوائي |
| `POST` | `/api/borrowers/:id/id-document` | رفع وثيقة هوية المقترض | `multipart/form-data` باسم حقل `document`؛ حد أقصى 10MB؛ صور أو PDF؛ اسم ملف عشوائي |

---

## 6. بنية الأمان

### 6.1 التحكم في الوصول القائم على الأدوار (RBAC)

يفرض النظام أربعة أدوار للمستخدمين وفق مصفوفة الوصول التالية:

| الميزة | المدير | المنظم | المقرض | المشاهد |
|--------|--------|--------|--------|---------|
| إدارة المستخدمين | كامل | لا شيء | لا شيء | لا شيء |
| إدارة المؤسسات | كامل | لا شيء | لا شيء | لا شيء |
| إدارة مفاتيح API | كامل | لا شيء | لا شيء | لا شيء |
| الفوترة | كامل | قراءة | لا شيء | لا شيء |
| سجلات التدقيق | كامل | قراءة | لا شيء | لا شيء |
| الموافقة/الرفض على التغييرات | نعم | نعم | لا شيء | لا شيء |
| أحكام المحاكم (إنشاء) | نعم | نعم | لا شيء | لا شيء |
| الرفع الدفعي | نعم | لا شيء | نعم | لا شيء |
| التقارير/التصدير | نعم | نعم | لا شيء | لا شيء |
| المقترضون/الحسابات | كامل | كامل | كامل | قراءة |
| النزاعات | كامل | كامل | كامل | كامل |
| إدارة الموافقات | كامل | كامل | كامل | كامل |
| لوحة المعلومات | كامل | كامل | كامل | كامل |
| مكتب المساعدة | كامل | كامل | كامل | كامل |

يتم فرض RBAC من جانب الخادم عبر دالة البرمجية الوسيطة `requireRole()` التي تتحقق من `req.session.userRole` مقابل الأدوار المسموحة.

### 6.2 إدارة الجلسات

| المعامل | القيمة | مرجع SRS |
|---------|--------|----------|
| مهلة الخمول | 15 دقيقة | NFR-SEC-09 |
| أقصى مدة للجلسة | 8 ساعات | maxAge لملف تعريف الارتباط |
| المخزن | memorystore | في الذاكرة، غير مستمر |
| أعلام ملف تعريف الارتباط | httpOnly=true, sameSite=lax, secure=false | — |
| فترة التنظيف | 24 ساعة | checkPeriod لـ memorystore |

يتم فرض مهلة الخمول بواسطة برمجية وسيطة من جانب الخادم تقارن `req.session.lastActivity` بالوقت الحالي. تتلقى الجلسات منتهية الصلاحية حالة HTTP 440.

### 6.3 سياسة كلمات المرور

| القاعدة | المتطلب |
|---------|---------|
| الحد الأدنى للطول | 8 أحرف |
| التعقيد | حرف كبير واحد على الأقل، حرف صغير واحد، رقم واحد، حرف خاص واحد |
| الانتهاء | 90 يوماً من آخر تغيير |
| التجزئة | bcrypt مع 10 جولات ملح |
| فرض التغيير | علامة `mustChangePassword` على سجل المستخدم |
| تعبير التحقق المنتظم | `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` |

### 6.4 قفل تسجيل الدخول

| المعامل | القيمة |
|---------|--------|
| أقصى عدد للمحاولات | 3 محاولات تسجيل دخول فاشلة متتالية |
| مدة القفل | 15 دقيقة |
| إعادة التعيين | تسجيل الدخول الناجح يعيد العداد إلى 0 |
| التتبع | أعمدة `failed_login_attempts` و`locked_until` في جدول المستخدمين |

### 6.5 مصادقة مفتاح API

تستخدم نقاط نهاية API الخارجية مصادقة مفتاح API عبر رأس HTTP `X-API-Key`:

1. يرسل العميل مفتاح API الكامل في رأس `X-API-Key`
2. يحسب الخادم تجزئة SHA-256 للمفتاح المقدم
3. يبحث الخادم عن التجزئة في جدول `api_keys`
4. يتحقق الخادم من أن حالة المفتاح `active` وحالة المؤسسة `active`
5. يتحقق الخادم من مستوى الإذن (`submit`، `read`، أو `full`) مقابل متطلبات نقطة النهاية
6. يتم تحديث طابع `last_used_at` الزمني بشكل غير متزامن

**توليد المفتاح:**
- التنسيق: `sim_{8_hex_chars}_{48_hex_chars}` (بادئة + سر)
- يُعرض المفتاح الكامل مرة واحدة فقط عند الإنشاء
- يتم تخزين تجزئة SHA-256 والبادئة فقط في قاعدة البيانات

### 6.6 تسجيل التدقيق

يتم تسجيل جميع الإجراءات المهمة في جدول `audit_logs` مع:
- **معرف المستخدم** للفاعل
- نوع **الإجراء** (LOGIN، CREATE، UPDATE، APPROVE، REJECT، FILE_DISPUTE، GRANT_CONSENT، REVOKE_CONSENT، BATCH_UPLOAD، BULK_SEARCH، GENERATE_REPORT، API_SUBMIT، API_BATCH_SUBMIT، API_CREDIT_REPORT، LOGIN_FAILED، ACCOUNT_LOCKED، PASSWORD_CHANGE، LOGOUT)
- نوع **الكيان** ومعرفه
- **عنوان IP** (عبر `req.ip` مع تفعيل trust proxy)
- **التفاصيل** — وصف قابل للقراءة
- **الطابع الزمني** — مولد تلقائياً

### 6.7 سير عمل صانع-مراجع

يتم فرض مبدأ العيون الأربع لتغييرات المقترضين والحسابات الائتمانية:

1. يمكن لأي مستخدم مصادق تقديم تغيير (CREATE أو UPDATE)
2. يتم تخزين التغيير في `pending_approvals` بحالة `pending`
3. فقط المستخدمون ذوو دور `admin` أو `regulator` يمكنهم الموافقة/الرفض
4. **منع الموافقة الذاتية:** يرفض الخادم الموافقة إذا كان `requestedBy === currentUserId` (HTTP 403)
5. عند الموافقة، يتم تطبيق حمولة التغيير تلقائياً على الكيان المستهدف
6. يتم إرسال إشعارات للمستخدمين المعنيين في كل خطوة

---

## 7. بنية النشر

### 7.1 بيئة Replit

التطبيق مصمم للنشر على Replit مع تكوين التوسع التلقائي:

```
Build Command: npm run build
Run Command:   node ./dist/index.cjs
```

### 7.2 عملية البناء

تتكون عملية البناء من مرحلتين:

1. **بناء الخادم (esbuild):**
   - نقطة الدخول: `server/index.ts`
   - الإخراج: `dist/index.cjs` (حزمة CommonJS)
   - المنصة: Node.js
   - الحزم الخارجية: مستبعدة من الحزمة (يتم حلها من node_modules)

2. **بناء الواجهة الأمامية (Vite):**
   - نقطة الدخول: `client/index.html`
   - الإخراج: `dist/public/` (أصول ثابتة)
   - يشمل: تحسين الأصول، تقسيم الشفرة، التصغير

### 7.3 خدمة الإنتاج

في الإنتاج (`NODE_ENV=production`)، تقوم وحدة `server/static.ts` بخدمة أصول الواجهة الأمامية المبنية من `dist/public/`. تتعامل مع سياقات ESM (`__dirname`) وCJS (`import.meta.url`) لحل المسارات.

في التطوير (`NODE_ENV=development`)، يُستخدم خادم تطوير Vite مع دعم HMR عبر `server/vite.ts`.

### 7.4 متغيرات البيئة

| المتغير | مطلوب | الافتراضي | الوصف |
|---------|-------|-----------|-------|
| `DATABASE_URL` | نعم | — | سلسلة اتصال PostgreSQL |
| `SESSION_SECRET` | موصى به | `credit-registry-dev-secret` | سر تشفير الجلسة |
| `PORT` | لا | `5000` | منفذ خادم HTTP |
| `NODE_ENV` | لا | `development` | وضع البيئة (`production` أو `development`) |

### 7.5 فحوصات الحالة

- **داخلي:** `GET /api/health` → `{ status: "ok" }`
- **خارجي:** `GET /api/external/v1/health` → `{ status: "ok", version: "1.1", service: "Systems In Motion Credit Registry API" }`

---

## 8. نقاط التكامل

### 8.1 واجهة REST API الخارجية

يعرض النظام واجهة REST API على `/api/external/v1/*` للمؤسسات للتفاعل البرمجي مع السجل:

**المصادقة:** مفتاح API عبر رأس HTTP `X-API-Key` مع تجزئة SHA-256.

**مستويات الأذونات:**
| المستوى | القدرات |
|---------|---------|
| `submit` | إنشاء المقترضين، الحسابات الائتمانية، سجل المدفوعات، أحكام المحاكم |
| `read` | بحث المقترضين، استرداد التقارير الائتمانية، عرض الحسابات الائتمانية |
| `full` | جميع قدرات submit + read |

**التقديم الدفعي:** نقاط النهاية التي تقبل بيانات POST تدعم كلاً من الكائن الفردي وحمولات المصفوفة. تعيد التقديمات الدفعية نتائج لكل سجل مع تفاصيل الأخطاء للسجلات الفاشلة.

**غلاف الاستجابة:** تتبع جميع استجابات API الخارجية تنسيق غلاف متسق بحقول `success`، `message`، `data`، و`timestamp`.

### 8.2 رفع الملفات الدفعي

تقبل ميزة الرفع الدفعي الداخلية (`POST /api/batch-upload/credit-accounts`) مصفوفات JSON من سجلات الحسابات الائتمانية:

**المدخلات المدعومة:**
```json
{
  "records": [
    {
      "borrowerId": "...",
      "lenderInstitution": "...",
      "accountNumber": "...",
      "accountType": "...",
      "originalAmount": "...",
      "currentBalance": "...",
      "currency": "ETB",
      "status": "current"
    }
  ]
}
```

**التحقق:** يتم التحقق من كل سجل بشكل مستقل مقابل `insertCreditAccountSchema` (Zod). يتم إدراج السجلات الصالحة؛ ويتم جمع السجلات غير الصالحة مع تفاصيل الأخطاء.

**الاستجابة:**
```json
{
  "totalSubmitted": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    { "index": 3, "message": "Required field 'accountNumber' missing" }
  ]
}
```

### 8.3 خدمة صور DiceBear الرمزية

يتكامل النظام مع واجهة DiceBear API (`https://api.dicebear.com`) لتوليد صور رمزية تلقائية لملفات المقترضين:

- **الاستخدام:** صور ملف شخصي افتراضية للمقترضين الذين لم يرفعوا صورة مخصصة
- **قيمة البذرة:** يُستخدم معرف المقترض كبذرة للصورة الرمزية — لا يتم إرسال معلومات تعريف شخصية (PII)
- **النمط:** توليد صور رمزية حتمي يضمن صوراً رمزية متسقة لنفس المقترض عبر الجلسات
- **الخصوصية:** لا يتطلب مصادقة؛ يتم إرسال تجزئة/معرف فقط كبذرة للخدمة

### 8.4 واجهة أسعار الصرف API

يتكامل النظام مع واجهة Open Exchange Rate API (`https://open.er-api.com`) لجلب أسعار العملات الحية:

- **الاستخدام:** جلب أسعار الصرف الحالية لأكثر من 42 عملة أفريقية بالإضافة إلى USD، EUR، GBP
- **المصادقة:** لا يتطلب مفتاح API (المستوى المجاني)
- **نقطة النهاية:** `GET https://open.er-api.com/v6/latest/{BASE_CURRENCY}`
- **التحديث:** يمكن تحديث الأسعار يدوياً عبر `POST /api/exchange-rates/refresh` أو جلبها عند الطلب
- **الاحتياط:** يُدعم إدخال الأسعار يدوياً عند عدم توفر API الخارجي

### 8.5 بنية رفع الملفات

يتم تخزين صور المقترضين ووثائق الهوية على نظام الملفات المحلي:

- **رفع الصور:** تُخزن في `uploads/photos/` (حد أقصى 5MB، صور فقط)
- **رفع الوثائق:** تُخزن في `uploads/documents/` (حد أقصى 10MB، صور أو PDF)
- **توليد أسماء الملفات:** أسماء ملفات عشوائية باستخدام الطابع الزمني وسلسلة base-36 عشوائية لمنع التصادم والتعداد
- **التحقق من نوع MIME:** تحقق من جانب الخادم عبر مرشح ملفات multer (صور فقط للصور؛ صور أو PDF للوثائق)
- **الخدمة:** ملفات ثابتة تُقدم عبر مسار `/uploads` المصادق مع برمجية `requireAuth` الوسيطة
- **تسجيل التدقيق:** يتم تسجيل جميع عمليات الرفع في سجل التدقيق مع معرف المستخدم الرافع ومرجع المقترض

### 8.6 تصدير CSV

تدعم وحدة التقارير تصدير CSV لبيانات المحفظة والمقترضين:

- `GET /api/reports/export?format=csv&type=portfolio` — بيانات محفظة الحسابات الائتمانية
- `GET /api/reports/export?format=csv&type=borrowers` — بيانات المقترضين الديموغرافية

يتم إنشاء الملفات فوراً مع رؤوس `Content-Type: text/csv` و`Content-Disposition` المناسبة.

---

## 9. مخططات تدفق البيانات

### 9.1 تدفق تسجيل دخول المستخدم

```
Client                          Server                          Database
  │                               │                               │
  │  POST /api/auth/login         │                               │
  │  { username, password }       │                               │
  │──────────────────────────────→│                               │
  │                               │  SELECT * FROM users          │
  │                               │  WHERE username = ?           │
  │                               │──────────────────────────────→│
  │                               │                    user record│
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Check: status === 'active'   │
  │                               │  Check: not locked            │
  │                               │  bcrypt.compare(password)     │
  │                               │                               │
  │                               │  [If valid]:                  │
  │                               │  Reset failed attempts        │
  │                               │  Update last_login            │
  │                               │  Set session (userId, role)   │
  │                               │  Create audit log (LOGIN)     │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { user, passwordExpired }│                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [If invalid (attempt < 3)]:  │
  │                               │  Increment failed_attempts    │
  │                               │  Create audit log (FAIL)      │
  │  401 "Invalid credentials"    │                               │
  │←──────────────────────────────│                               │
  │                               │                               │
  │                               │  [If 3rd failure]:            │
  │                               │  Lock account 15 min          │
  │                               │  Create audit log (LOCKED)    │
  │  423 "Account locked"         │                               │
  │←──────────────────────────────│                               │
```

### 9.2 تسجيل المقترض مع صانع-مراجع

```
Lender User                     Server                          Database
  │                               │                               │
  │  POST /api/borrowers          │                               │
  │  { type, firstName, ... }     │                               │
  │──────────────────────────────→│                               │
  │                               │  Validate with Zod schema     │
  │                               │  INSERT pending_approvals     │
  │                               │  (status = 'pending')         │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Create audit log             │
  │                               │  Notify admin/regulator users │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  201 { approval, message }    │                               │
  │←──────────────────────────────│                               │
  │                               │                               │

Admin/Regulator                 Server                          Database
  │                               │                               │
  │  PATCH /api/pending-approvals/:id                             │
  │  { status: "approved" }       │                               │
  │──────────────────────────────→│                               │
  │                               │  Check: requestedBy !== me    │
  │                               │  Check: status === 'pending'  │
  │                               │                               │
  │                               │  Update approval status       │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  [If approved]:               │
  │                               │  Parse payload JSON           │
  │                               │  INSERT INTO borrowers        │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Create audit log (APPROVE)   │
  │                               │  Notify requester             │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { updated approval }     │                               │
  │←──────────────────────────────│                               │
```

### 9.3 إنشاء التقرير الائتماني

```
User                            Server                          Database
  │                               │                               │
  │  POST /api/credit-reports/generate                            │
  │  { borrowerId, purpose }      │                               │
  │──────────────────────────────→│                               │
  │                               │  Get borrower                 │
  │                               │  Get credit accounts          │
  │                               │  Get credit inquiries         │
  │                               │  Get court judgments           │
  │                               │  Get consent records          │
  │                               │  Get payment history (each)   │
  │                               │──────────────────────────────→│
  │                               │                    all data   │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Generate serial number       │
  │                               │  (CR-{YEAR}-{base36})         │
  │                               │                               │
  │                               │  Calculate credit score       │
  │                               │  (300-850 algorithm)          │
  │                               │  Generate reason codes        │
  │                               │                               │
  │                               │  INSERT credit_report_logs    │
  │                               │  INSERT audit_logs            │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { serialNumber, score,   │                               │
  │    reasonCodes, accounts,     │                               │
  │    judgments, consents, ... }  │                               │
  │←──────────────────────────────│                               │
```

### 9.4 تدفق تقديم API الخارجي

```
Institution                     Server                          Database
  │                               │                               │
  │  POST /api/external/v1/borrowers                              │
  │  X-API-Key: sim_xxxx_yyyy     │                               │
  │  [{ ... }, { ... }]           │                               │
  │──────────────────────────────→│                               │
  │                               │  SHA-256 hash the key         │
  │                               │  Lookup api_keys by hash      │
  │                               │──────────────────────────────→│
  │                               │                     api_key   │
  │                               │←──────────────────────────────│
  │                               │                               │
  │                               │  Check: key status = active   │
  │                               │  Check: institution active    │
  │                               │  Check: permission = submit   │
  │                               │                               │
  │                               │  For each record:             │
  │                               │    Validate with Zod          │
  │                               │    INSERT borrowers           │
  │                               │──────────────────────────────→│
  │                               │                               │
  │                               │  Update key last_used_at      │
  │                               │  Create audit log             │
  │                               │──────────────────────────────→│
  │                               │                               │
  │  200 { success: true,         │                               │
  │    submitted: N, failed: M,   │                               │
  │    results: [...],            │                               │
  │    errors: [...] }            │                               │
  │←──────────────────────────────│                               │
```

### 9.5 دورة حياة النزاع

```
مخطط الحالة:

  ┌──────┐     تقديم    ┌──────────────┐
  │ لا شيء│──────────────→│     OPEN      │
  └──────┘               └──────┬───────┘
                                │
                          مراجعة│
                                │
                         ┌──────▼───────┐
                         │ UNDER_REVIEW │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │                       │
              حل   │                رفض    │
                    │                       │
             ┌──────▼──┐           ┌───────▼───┐
             │ RESOLVED │           │ REJECTED  │
             └─────────┘           └───────────┘

مواعيد اتفاقية مستوى الخدمة:
  - التصحيحات المالية: يوما عمل من التقديم
  - التصحيحات غير المالية: 5 أيام عمل من التقديم
  - يتم حساب موعد اتفاقية مستوى الخدمة عند الإنشاء بناءً على correctionType
```

---

## 10. معالجة الأخطاء

### 10.1 التحقق عبر Zod

يتم التحقق من جميع نصوص الطلبات الواردة باستخدام مخططات Zod المشتقة من تعريفات جداول Drizzle عبر `drizzle-zod`:

- `insertBorrowerSchema` — إنشاء/تحديث المقترض
- `insertCreditAccountSchema` — إنشاء/تحديث الحساب الائتماني
- `insertCreditInquirySchema` — إنشاء الاستعلام الائتماني
- `insertUserSchema` — إنشاء المستخدم
- `insertPendingApprovalSchema` — تقديم الموافقة
- `insertDisputeSchema` — تقديم النزاع
- `insertCourtJudgmentSchema` — إنشاء حكم المحكمة
- `insertConsentRecordSchema` — إنشاء الموافقة
- `insertPaymentHistorySchema` — إدخال سجل المدفوعات
- `insertInstitutionSchema` — تسجيل المؤسسة
- `insertBillingRecordSchema` — إنشاء سجل الفوترة
- `insertCreditReportLogSchema` — إنشاء سجل التقرير الائتماني
- `insertApiKeySchema` — إنشاء مفتاح API
- `insertExchangeRateSchema` — إنشاء سعر الصرف
- `insertRetentionPolicySchema` — إنشاء سياسة الاحتفاظ
- `insertApiConfigurationSchema` — إنشاء تكوين API

تعيد فشل التحقق HTTP 400 مع رسالة خطأ Zod.

### 10.2 برمجية الأخطاء الوسيطة

تلتقط برمجية أخطاء Express الوسيطة (`server/index.ts`) الأخطاء غير المعالجة:

```typescript
app.use((err, _req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});
```

### 10.3 التدهور الرشيق

- يتم تجاهل إشارة **SIGHUP** لمنع الإنهاء الناتج عن سير العمل
- يتم تجاهل إشارة **SIGPIPE** للتعامل مع سيناريوهات الأنبوب المكسور
- يتم تسجيل **الاستثناءات غير الملتقطة** و**الوعود المرفوضة غير المعالجة** دون إيقاف العملية
- يتم التقاط فشل **إنشاء الإشعارات** بصمت (غير حرج)
- يتم تسجيل أخطاء **تطبيق صانع-مراجع** دون إفشال تحديث الموافقة

### 10.4 رموز حالة HTTP

| الرمز | الاستخدام |
|-------|----------|
| 200 | استجابة ناجحة |
| 201 | تم إنشاء المورد |
| 400 | خطأ في التحقق / طلب غير صالح |
| 401 | المصادقة مطلوبة / بيانات اعتماد غير صالحة |
| 403 | أذونات غير كافية / منع الموافقة الذاتية |
| 404 | المورد غير موجود |
| 423 | الحساب مقفل |
| 440 | انتهت صلاحية الجلسة (مهلة الخمول) |
| 500 | خطأ داخلي في الخادم |

---

## 11. الأداء

### 11.1 تجميع الاتصالات

تم تكوين تجمع اتصالات PostgreSQL لكفاءة الموارد:

```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 30000,
});
```

- **أقصى عدد اتصالات:** 2 (مناسب للنشر على مثيل واحد)
- **مهلة الخمول:** 30 ثانية

### 11.2 ترقيم الصفحات من جانب الخادم

تطبق الجداول ذات الحجم الكبير ترقيم صفحات من جانب الخادم:

- **المقترضون:** `GET /api/borrowers?page=1&limit=50` (حد أقصى 200 لكل صفحة)
- **المؤسسات:** `GET /api/institutions?page=1&limit=50` (حد أقصى 200 لكل صفحة)

تنسيق الاستجابة:
```json
{
  "data": [...],
  "total": 100005
}
```

### 11.3 حدود الاستعلامات

تطبق نقاط النهاية غير المرقمة حدود استعلام لمنع مشاكل الذاكرة:

| الكيان | الحد الافتراضي |
|--------|---------------|
| الحسابات الائتمانية | 200 سجل |
| الاستعلامات الائتمانية | 200 سجل |
| سجلات التدقيق | 200 سجل |
| أحكام المحاكم | 200 سجل |
| سجلات الموافقة | 200 سجل |
| سجلات التقارير الائتمانية | 200 سجل |
| نتائج البحث | 200 سجل |
| الإشعارات | 50 سجل |
| سجل المدفوعات | 12 سجل (لكل حساب) |

### 11.4 أحجام بيانات البذر

يتم بذر النظام بأحجام بيانات تمثل الإنتاج:

| الكيان | العدد |
|--------|------|
| المقترضون | 102,462 |
| المؤسسات | 100,020 |
| الحسابات الائتمانية | 172,359 |
| سجل المدفوعات | 120,000 |
| الاستعلامات الائتمانية | 25,004 |
| سجلات الموافقة | 15,000 |
| سجلات التدقيق | 5,063 |
| النزاعات | 3,218 |
| أحكام المحاكم | 2,147 |
| سجلات الفوترة | 120 |
| مستخدمو النظام | 6 |

---

## 12. المراقبة والتسجيل

### 12.1 سجل التدقيق

يتم تسجيل جميع إجراءات النظام المهمة في جدول `audit_logs`. سجل التدقيق غير قابل للتغيير (إدراج فقط) ويلتقط:

- **تعريف الفاعل** — معرف المستخدم للشخص/النظام الذي ينفذ الإجراء
- **تصنيف الإجراء** — سلاسل نوع إجراء موحدة
- **تتبع الكيان** — نوع ومعرف الكيان المتأثر
- **تتبع IP** — عنوان IP للعميل (عبر Express trust proxy)
- **الطوابع الزمنية** — وقت إنشاء مولد تلقائياً
- **التفاصيل** — وصف قابل للقراءة للإجراء

**أنواع الإجراءات:**
`LOGIN`، `LOGIN_FAILED`، `ACCOUNT_LOCKED`، `LOGOUT`، `PASSWORD_CHANGE`، `CREATE`، `UPDATE`، `SUBMIT_APPROVAL`، `APPROVE`، `REJECT`، `FILE_DISPUTE`، `UPDATE_DISPUTE`، `GRANT_CONSENT`، `REVOKE_CONSENT`، `VIEW`، `GENERATE_REPORT`، `BATCH_UPLOAD`، `BULK_SEARCH`، `API_SUBMIT`، `API_BATCH_SUBMIT`، `API_CREDIT_REPORT`، `UPLOAD_PHOTO`، `UPLOAD_ID_DOCUMENT`، `MFA_ENABLED`، `MFA_DISABLED`

### 12.2 تسجيل طلبات API

يتم تسجيل جميع طلبات `/api/*` في وحدة التحكم مع:

- طريقة HTTP والمسار
- رمز حالة الاستجابة
- زمن الاستجابة بالمللي ثانية
- نص الاستجابة المقتطع (أول 200 حرف)

التنسيق: `{time} [express] {METHOD} {path} {status} in {duration}ms :: {response_preview}`

### 12.3 تسجيل وحدة التحكم

توفر دالة `log()` في `server/index.ts` مخرجات وحدة تحكم بطوابع زمنية:

```
1:30:45 PM [express] POST /api/auth/login 200 in 45ms :: {"id":"...","username":"admin",...}
```

يتم تسجيل حالات الخطأ عبر `console.error()` لـ:
- الاستثناءات غير الملتقطة
- الوعود المرفوضة غير المعالجة
- أخطاء الخادم الداخلية
- أخطاء بذر قاعدة البيانات
- أخطاء تطبيق صانع-مراجع

---

## 13. التحسينات المؤسسية (الإصدار 1.1 — الإصدار 1.2)

### 13.1 المصادقة متعددة العوامل TOTP (ENT-01)

**الغرض:** إضافة عامل مصادقة ثانٍ باستخدام كلمات مرور لمرة واحدة قائمة على الوقت (TOTP) متوافقة مع تطبيقات المصادقة (Google Authenticator، Authy، إلخ).

**البنية:**
- **المكتبة:** `otpauth` لتوليد والتحقق من TOTP
- **المخطط:** أعمدة `mfaSecret` (varchar, nullable) و`mfaEnabled` (boolean, default false) في جدول `users`
- **نقاط النهاية:** `POST /api/auth/mfa/setup`، `POST /api/auth/mfa/verify`، `POST /api/auth/mfa/disable`، `POST /api/auth/mfa/login`
- **الواجهة الأمامية:** مكون `mfa-setup.tsx` مع عرض URI لرمز QR ومدخل التحقق
- **التدويل:** ترجمات كاملة EN/FR/PT تحت مفاتيح `mfa.*` و`login.mfa*`

**التدفق:**
1. يفعل المستخدم MFA عبر حوار الإعداد → يولد الخادم سر TOTP → يعرض العميل URI `otpauth://`
2. يمسح المستخدم رمز QR بتطبيق المصادقة → يدخل رمزاً من 6 أرقام → يتحقق الخادم ويضبط `mfaEnabled = true`
3. في عمليات تسجيل الدخول اللاحقة، يعيد `POST /api/auth/login` `{ requireMfa: true }` → يعرض العميل مدخل الرمز → يكمل `POST /api/auth/mfa/login` المصادقة

### 13.2 المطابقة الضبابية للكيانات (ENT-02)

**الغرض:** الكشف عن المقترضين المكررين المحتملين أثناء التسجيل باستخدام مطابقة تشابه المثلثات.

**البنية:**
- **الإضافة:** `pg_trgm` مفعلة عبر `CREATE EXTENSION IF NOT EXISTS pg_trgm` عند تهيئة التجمع في `server/db.ts`
- **نقطة النهاية:** `GET /api/borrowers/fuzzy-match?name=<query>` — تعيد المكررات المحتملة مع درجات التشابه
- **الحد الأدنى:** عتبة تشابه 0.3 لتصفية النتائج ذات الصلة
- **الواجهة الأمامية:** مدمجة في نموذج تسجيل المقترض مع تحذير التكرار

### 13.3 روبوت النزاعات (ENT-03)

**الغرض:** مساعد محادثة موجه يرشد المستخدمين عبر عملية تقديم النزاعات بشكل خطوة بخطوة.

**البنية:**
- **المكون:** `client/src/components/dispute-chatbot.tsx`
- **التدفق:** عملية متعددة الخطوات — اختيار نوع النزاع → اختيار المقترض → تحديد نوع التصحيح → وصف النزاع → التأكيد
- **التقديم:** ينشئ نزاعاً عبر `POST /api/disputes` عند التأكيد
- **التدويل:** مترجم بالكامل عبر مفاتيح `chatbot.*`

### 13.4 مصادقة OAuth 2.1 (ENT-04)

**الغرض:** يتيح مصادقة رمز الحامل لـ API الخارجي كبديل لمفاتيح API المباشرة.

**البنية:**
- **المنح:** `client_credentials` فقط (اتصال آلة إلى آلة)
- **الرموز:** JWT موقع بسر التطبيق، انتهاء صلاحية ساعة واحدة
- **نقطة النهاية:** `POST /api/external/oauth/token`
- **الاستخدام:** رمز الحامل في رأس `Authorization: Bearer <token>` كبديل لرأس `X-API-Key`
- **التوافق:** كلتا الطريقتين (مفتاح API ورمز الحامل) مدعومتان في آن واحد على جميع نقاط نهاية API الخارجية

### 13.5 تحسين النطاق الترددي المنخفض (ENT-05)

**الغرض:** تقليل استهلاك النطاق الترددي لأسواق أفريقيا حيث قد يكون الاتصال محدوداً.

**البنية:**
- **ضغط gzip:** تفعيل ضغط gzip على مستوى Express لجميع استجابات API
- **تقسيم الشفرة:** `React.lazy()` مع `Suspense` لمكونات الصفحات — يتم تحميل كل مسار عند الطلب فقط
- **التأثير:** تقليل حجم حزمة JavaScript الأولية وأحجام استجابة API

### 13.6 رفع XBRL (ENT-06)

**الغرض:** دعم تنسيق XBRL/XML لتقديم البيانات الدفعية كتنسيق متوافق مع المعايير المالية.

**البنية:**
- **نقطة النهاية:** `POST /api/batch-upload/credit-accounts` (نفس نقطة نهاية الرفع الدفعي)
- **التحليل:** اكتشاف تنسيق XML/XBRL واستخراج الحقول المتوافقة مع `credit_accounts`
- **التحقق:** نفس التحقق عبر Zod المطبق على مدخلات JSON

### 13.7 سلسلة تجزئة سجل التدقيق (ENT-07)

**الغرض:** ضمان مقاومة التلاعب لسجلات التدقيق عبر ربط SHA-256 التسلسلي.

**البنية:**
- **الأعمدة:** `previous_hash` و`current_hash` في جدول `audit_logs`
- **الخوارزمية:** `SHA-256(previousHash + action + entity + details + timestamp)`
- **التكوين الأولي:** الإدخال الأول يستخدم `"genesis"` كـ `previous_hash`
- **التحقق:** `GET /api/audit/verify-integrity` يعيد حساب وتحقق السلسلة الكاملة
- **الحماية:** أي تعديل لسجل تدقيق واحد يكسر سلسلة التجزئة ويُكتشف عبر التحقق

### 13.8 إدارة أسعار الصرف (ENT-08)

**الغرض:** دعم شامل للعملات المتعددة عبر أكثر من 42 عملة أفريقية بالإضافة إلى العملات الرئيسية.

**البنية:**
- **المخطط:** جدول `exchange_rates` مع `base_currency`، `target_currency`، `rate`، `effective_date`، `source`
- **توجيه الأسعار المتقاطعة:** عند عدم توفر سعر مباشر، يحول النظام عبر USD كوسيط (مثال: GHS → USD → ETB)
- **نقاط النهاية:** `GET /api/exchange-rates`، `POST /api/exchange-rates`، `PATCH /api/exchange-rates/:id`، `DELETE /api/exchange-rates/:id`، `POST /api/exchange-rates/convert`
- **جلب الأسعار الحية:** التكامل مع open.er-api.com لتحديث الأسعار تلقائياً؛ تحديث يدوي عبر `POST /api/exchange-rates/refresh`
- **الواجهة الأمامية:** صفحة `exchange-rates.tsx` مع واجهة إدارة CRUD وأداة تحويل العملات تدعم جميع العملات الأفريقية الـ 42+ بالإضافة إلى USD، EUR، GBP
- **العملات:** GHS، ETB، UGX، LRD، NGN، KES، ZAR، EGP، MAD، TZS، RWF، XOF، XAF، MZN، AOA، BWP، ZMW، DZD، TND، LYD، MRU، SDG، ERN، DJF، SOS، SCR، MUR، MWK، ZWL، NAD، SZL، LSL، KMF، BIF، GMD، GNF، SLL، CVE، STN، CDF، SSP، USD، EUR، GBP

### 13.9 وحدة إدارة API (ENT-09)

**الغرض:** إدارة تكوين مركزية لواجهات API الخارجية (الطقس، القضاء، بوابة الدفع، سعر الصرف) لكل دولة مع اختبار الاتصال وحماية SSRF.

**البنية:**
- **المخطط:** جدول `api_configurations` مع `name`، `category`، `base_url`، `api_key_header_name`، `auth_type`، `country`، `is_active`، `last_tested_at`، `last_test_status`
- **الفئات:** weather، judicial، payment_gateway، exchange_rate
- **أنواع المصادقة:** none، api_key، bearer، basic
- **نقاط النهاية:** `GET /api/api-configurations`، `POST /api/api-configurations`، `PATCH /api/api-configurations/:id`، `DELETE /api/api-configurations/:id`، `POST /api/api-configurations/:id/test`
- **حماية SSRF:** يتحقق اختبار الاتصال من صحة عناوين URL مقابل نطاقات الشبكات الداخلية/الخاصة قبل إجراء الطلبات الصادرة
- **الواجهة الأمامية:** صفحة `api-admin.tsx` مع إدارة تكوين API لكل دولة وواجهة اختبار الاتصال

### 13.10 محرك تنفيذ الاحتفاظ (ENT-10)

**الغرض:** تنفيذ آلي ويدوي للاحتفاظ بالبيانات مع سياسات لكل دولة، ونتائج مسجلة في التدقيق، وSQL مُعلم لتنفيذ آمن.

**البنية:**
- **المخطط:** جدول `retention_policies` مع `country`، `entity_type`، `retention_years`، `archive_after_years`، `is_active`
- **الجدولة:** تنفيذ آلي بفاصل 24 ساعة عبر `server/retention-enforcement.ts`
- **المشغل اليدوي:** نقطة نهاية `POST /api/retention-policies/enforce` للتنفيذ عند الطلب
- **سياسات لكل دولة:** فترات احتفاظ قابلة للتكوين لكل دولة عبر جميع الاختصاصات القضائية الأفريقية الـ 54. سياسات البذر الافتراضية:
  - غانا: احتفاظ 10 سنوات
  - ليبيريا: احتفاظ 7 سنوات
  - إثيوبيا: احتفاظ 7 سنوات
  - أوغندا: احتفاظ 7 سنوات
- **نقاط النهاية:** `GET /api/retention-policies`، `POST /api/retention-policies`، `PATCH /api/retention-policies/:id`، `DELETE /api/retention-policies/:id`، `POST /api/retention-policies/enforce`
- **الأمان:** تستخدم جميع استعلامات قاعدة البيانات SQL مُعلم لمنع الحقن؛ يتم تسجيل نتائج التنفيذ في التدقيق
- **الواجهة الأمامية:** صفحة `retention-policies.tsx` مع إدارة CRUD للسياسات ومشغل التنفيذ اليدوي

### 13.11 حل الكيانات العابرة للحدود (ENT-11)

**الغرض:** تحسين تعريف المقترضين العابرين للحدود باستخدام أرقام جوازات السفر وأنواع العلاقات الموسعة والمطابقة الضبابية عبر حقول هوية متعددة.

**البنية:**
- **حقل جواز السفر:** عمود `passport_number` (text, nullable) في جدول `borrowers` للتعريف عبر الاختصاصات القضائية
- **أنواع العلاقات:** 7 أنواع مدعومة — `spouse`، `guarantor`، `director`، `shareholder`، `beneficial_owner`، `subsidiary`، `parent_company`
- **المطابقة الضبابية:** تشابه المثلثات `pg_trgm` في PostgreSQL موسع للمطابقة على رقم جواز السفر والرقم الضريبي وحقول الاسم
- **نقطة النهاية:** `GET /api/borrowers/fuzzy-match?name=<query>` — تعيد المكررات المحتملة مع درجات التشابه عبر جميع حقول الهوية

### 13.12 دعم اللغة البرتغالية (ENT-12)

**الغرض:** ترجمة برتغالية (pt) كاملة لجميع واجهات النظام، توسيعاً للترجمات الإنجليزية/الفرنسية الحالية.

**البنية:**
- **ملف الترجمة:** `client/src/lib/i18n-pt.ts` — مورد ترجمة PT كامل يغطي جميع سلاسل واجهة المستخدم
- **التكامل:** مسجل كمورد لغة `pt` في تكوين i18next في `client/src/lib/i18n.ts`
- **مبدل اللغة:** محدد لغة يدوي متاح في صفحة تسجيل الدخول ورأس التطبيق الرئيسي (`client/src/components/language-switcher.tsx`)
- **التغطية:** جميع عناصر التنقل والنماذج ورسائل الخطأ وتسميات لوحة المعلومات والمفاتيح الخاصة بالميزات (MFA، روبوت المحادثة، الرفع الدفعي، النزاعات، إلخ)

### 13.13 بيئة العرض التوضيحي للمستثمرين (ENT-13)

**الغرض:** وصول تجريبي بنقرة واحدة للمستثمرين والمقيّمين وأصحاب المصلحة لاستكشاف النظام الكامل باستخدام بيانات اعتماد مهيأة مسبقاً حسب الدور دون الحاجة إلى إعداد حساب.

**البنية:**
- **صفحة تسجيل الدخول:** زر "Try Interactive Demo" يعرض 3 بطاقات أدوار (Admin، Regulator، Bank Officer) لتسجيل الدخول الفوري
- **شعار العرض التوضيحي:** شعار "DEMO ENVIRONMENT" بلون كهرماني يستمر عبر جميع الصفحات، مشيراً إلى وضع البيانات الوهمية
- **إخلاء مسؤولية البيانات:** إشعار تحذيري في صفحة اختيار العرض التوضيحي يبلغ المستخدمين بأن جميع البيانات هي بيانات اختبار مبدئية (102,462 مقترض، 172,359 حساب ائتماني عبر 54 دولة)
- **معالجة الجلسة:** يستخدم تسجيل الدخول التجريبي تدفق المصادقة القياسي مع بيانات اعتماد مبدئية مهيأة مسبقاً

### 13.14 التحليلات المرئية للوحة المعلومات (ENT-14)

**الغرض:** مجموعة تصورات بيانية تفاعلية للوحة المعلومات، توفر رؤى فورية للمحفظة من خلال رسوم بيانية متجاوبة وخريطة choropleth جغرافية لجميع الدول الأفريقية الـ 54.

**البنية:**
- **المكونات:**
  - `client/src/components/dashboard-charts.tsx` — تصورات مبنية على Recharts تتضمن رسم بياني مساحي لاتجاهات 12 شهراً (نمو المقترضين والحسابات)، ورسم بياني دائري مفرغ لتوزيع حالات الحسابات، ورسم بياني أفقي شريطي لتوزيع أنواع القروض
  - `client/src/components/africa-map.tsx` — خريطة SVG choropleth تعرض جميع الدول الأفريقية الـ 54 بتلوين حراري حسب عدد المقترضين، وتلميحات عند التمرير تعرض اسم الدولة وعدد المقترضين وعدد الحسابات، ومفتاح يوضح مستويات النشاط
- **واجهة برمجة التطبيقات:** `GET /api/dashboard/chart-data` (محمية عبر البرمجيات الوسيطة `requireAuth`) تعيد:
  - `monthlyTrend` — مصفوفة من نقاط البيانات الشهرية مع أعداد المقترضين والحسابات
  - `statusBreakdown` — توزيع حالات الحسابات (current، delinquent، default، closed، restructured، written_off)
  - `typeBreakdown` — توزيع أنواع القروض (term_loan، overdraft، mortgage، إلخ)
  - `countryBreakdown` — أعداد المقترضين والحسابات لكل دولة عبر جميع الولايات القضائية الأفريقية الـ 54
- **المكتبة:** Recharts للتصور البياني المتجاوب والمُنسق مع تنسيق تلقائي للمحاور وتلميحات مخصصة
- **الوضع الداكن:** دعم كامل للوضع الداكن عبر كشف متغيرات CSS؛ ألوان الرسوم البيانية والخلفيات تتكيف مع السمة النشطة
- **الاستجابة:** جميع الرسوم البيانية تستخدم `ResponsiveContainer` لتغيير الحجم بسلاسة عبر أحجام نوافذ العرض المختلفة

### 13.15 الجولة التوضيحية التفاعلية (ENT-15)

**الغرض:** جولة إرشادية من 11 خطوة تُعرّف المستخدمين الجدد بالميزات الرئيسية للنظام في بيئة العرض التوضيحي.

**البنية:**
- **المكون:** `client/src/components/demo-tour.tsx` — طبقة جولة مستقلة مع تسليط ضوئي وأوصاف الخطوات وعناصر التنقل
- **الخطوات:** 11 محطة جولة تغطي التنقل في الشريط الجانبي، وبطاقات الإحصائيات، ورسم نمو المحفظة، ورسم حالة الحسابات، ورسم أنواع القروض، وخريطة أفريقيا، والبحث الائتماني، وإدارة المقترضين، والإعدادات، والإكمال
- **التشغيل التلقائي:** تنطلق الجولة تلقائياً بعد تسجيل الدخول التجريبي عبر علم `sessionStorage` (`demo_tour_shown`)؛ تعمل مرة واحدة فقط لكل جلسة
- **عناصر التحكم:** أزرار Next وBack وSkip وClose للتنقل الذي يحركه المستخدم عبر خطوات الجولة
- **طبقة التسليط الضوئي:** خلفية شبه شفافة مع قطع تسليط ضوئي حول عنصر واجهة المستخدم المستهدف لكل خطوة
- **إعادة التشغيل:** يمكن للمستخدمين إعادة تشغيل الجولة في أي وقت عبر زر "Take a Tour" في شعار بيئة العرض التوضيحي الكهرماني
- **التدويل:** عناوين وأوصاف خطوات الجولة مترجمة بالكامل في جميع لغات الاتحاد الأفريقي الخمس (الإنجليزية، الفرنسية، البرتغالية، العربية، السواحلية) عبر مفاتيح i18n تحت `tour.*`

---

*نهاية وثائق النظام*

*أُعدت الوثيقة بواسطة Systems In Motion Limited*  
*نظام مركز البيانات المركزي العابر للحدود وسجل الائتمان الإصدار 1.2*
