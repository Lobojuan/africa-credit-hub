# قاموس البيانات

## نظام مركز البيانات المركزي العابر للحدود وسجل الائتمان الإصدار 2.5

**مُعد لصالح:** Systems In Motion Limited  
**إصدار الوثيقة:** 2.5  
**التاريخ:** أبريل 2026

---

## 1. نظرة عامة

توفر هذه الوثيقة توثيقاً على مستوى الحقول لجميع جداول قاعدة البيانات الـ 21 في نظام سجل الائتمان. يدعم النظام جميع الدول الأفريقية الـ 54 مع أكثر من 42 عملة أفريقية بالإضافة إلى USD وEUR وGBP. تستخدم قاعدة البيانات PostgreSQL مع Drizzle ORM لإدارة المخطط.

**ملخص تأثير التحسينات المؤسسية على المخطط:**

| التحسين | تغييرات المخطط |
|---------|---------------|
| ENT-01 (MFA) | إضافة أعمدة `mfa_secret` و`mfa_enabled` إلى جدول `users` |
| ENT-02 (المطابقة الضبابية) | لا توجد جداول/أعمدة جديدة؛ يستخدم إضافة PostgreSQL `pg_trgm` على أعمدة `borrowers.first_name`/`borrowers.last_name` الحالية |
| ENT-03 (روبوت النزاعات) | لا توجد جداول/أعمدة جديدة؛ يستخدم جدول `disputes` الحالي للنزاعات المقدمة تلقائياً |
| ENT-04 (OAuth 2.1) | لا توجد جداول/أعمدة جديدة؛ رموز JWT بدون حالة وموقعة في الذاكرة باستخدام `api_keys` الحالية للتحقق |
| ENT-05 (عرض النطاق المنخفض) | لا توجد تغييرات في المخطط؛ الضغط وتقسيم الشفرة هي تحسينات على مستوى التطبيق |
| ENT-06 (رفع XBRL) | لا توجد جداول/أعمدة جديدة؛ يتم تحليل سجلات XBRL/XML وإدراجها في جدول `credit_accounts` الحالي عبر الرفع الدفعي |
| ENT-07 (سلسلة التجزئة) | إضافة أعمدة `previous_hash` و`current_hash` إلى جدول `audit_logs` |
| ENT-08 (أسعار الصرف) | جدول `exchange_rates` جديد لإدارة أسعار العملات المتعددة عبر أكثر من 42 عملة أفريقية |
| ENT-09 (إدارة API) | جدول `api_configurations` جديد لإدارة تكامل API الخارجي المركزي |
| ENT-10 (الاحتفاظ) | جدول `retention_policies` جديد لتكوين فترات الاحتفاظ بالبيانات حسب الاختصاص القضائي |
| ENT-11 (البحث الشامل) | لا توجد تغييرات في المخطط؛ البحث عبر الكيانات يستخدم الجداول الحالية عبر نقطة النهاية `/api/global-search` |
| ENT-12 (صور الهوية) | إضافة أعمدة `photo_url` و`id_document_url` إلى جدول `borrowers` لصور الملف الشخصي ومسح وثائق الهوية |
| ENT-13 (بيئة العرض) | لا توجد تغييرات في المخطط؛ وضع العرض التوضيحي للمستثمرين مع بطاقات تسجيل دخول حسب الدور باستخدام المخطط الحالي |

---

## 2. الأنواع المعددة

### 2.1 user_role
| القيمة | الوصف |
|--------|-------|
| admin | وصول كامل للنظام، إدارة المستخدمين، إدارة المؤسسات، إدارة مفاتيح API |
| regulator | وصول إلى سجلات التدقيق، الفوترة، الموافقات، التحليلات |
| lender | إدخال البيانات، إدارة المقترضين، الرفع الدفعي |
| viewer | وصول للقراءة فقط للمقترضين والحسابات والتقارير |

### 2.2 user_status
| القيمة | الوصف |
|--------|-------|
| active | يمكن للمستخدم تسجيل الدخول والوصول إلى النظام |
| suspended | المستخدم محظور مؤقتاً من الوصول |
| deactivated | المستخدم محظور نهائياً من الوصول |

### 2.3 borrower_type
| القيمة | الوصف |
|--------|-------|
| individual | مقترض شخص طبيعي |
| corporate | مقترض كيان تجاري |

### 2.4 account_status
| القيمة | الوصف |
|--------|-------|
| current | الحساب في وضع جيد مع سداد المدفوعات في موعدها |
| delinquent | حساب به مدفوعات متأخرة |
| default | حساب في حالة تعثر (تأخر شديد) |
| closed | حساب مسدد بالكامل ومغلق |
| restructured | حساب تمت إعادة هيكلته |
| written_off | حساب تم شطبه كغير قابل للتحصيل |

### 2.5 inquiry_purpose
| القيمة | الوصف |
|--------|-------|
| new_credit | استعلام لطلب ائتمان جديد |
| review | مراجعة دورية للحساب |
| collection | استعلام متعلق بالتحصيل |
| regulatory | فحص تنظيمي |
| portfolio_monitoring | مراقبة مخاطر المحفظة |

### 2.6 approval_status
| القيمة | الوصف |
|--------|-------|
| pending | في انتظار المراجعة |
| approved | تمت الموافقة من قبل المراجع |
| rejected | تم الرفض من قبل المراجع |

### 2.7 dispute_status
| القيمة | الوصف |
|--------|-------|
| open | نزاع مقدم حديثاً |
| under_review | النزاع قيد التحقيق |
| resolved | تم حل النزاع |
| rejected | تم رفض النزاع |

### 2.8 judgment_type
| القيمة | الوصف |
|--------|-------|
| lien | مطالبة قانونية على الممتلكات |
| bankruptcy | إيداع إفلاس |
| lawsuit | دعوى قضائية نشطة |
| civil_judgment | حكم مدني |
| criminal_conviction | إدانة جنائية |

### 2.9 judgment_status
| القيمة | الوصف |
|--------|-------|
| active | الحكم نشط حالياً |
| resolved | تم حل الحكم أو الوفاء به |
| appealed | الحكم قيد الاستئناف |

### 2.10 consent_status
| القيمة | الوصف |
|--------|-------|
| active | الموافقة نشطة حالياً |
| revoked | تم إلغاء الموافقة |

### 2.11 payment_status
| القيمة | الوصف |
|--------|-------|
| on_time | تم السداد في الموعد المحدد |
| late | تم السداد بعد تاريخ الاستحقاق |
| missed | لم يتم السداد |
| partial | تم سداد جزئي |

### 2.12 institution_status
| القيمة | الوصف |
|--------|-------|
| pending | في انتظار موافقة المدير |
| active | تمت الموافقة والتفعيل |
| suspended | معلق مؤقتاً |

### 2.13 billing_status
| القيمة | الوصف |
|--------|-------|
| pending | فاتورة في انتظار السداد |
| paid | فاتورة مسددة |
| overdue | فاتورة متأخرة عن تاريخ الاستحقاق |

### 2.14 api_key_status
| القيمة | الوصف |
|--------|-------|
| active | مفتاح API نشط وقابل للاستخدام |
| revoked | تم إلغاء مفتاح API |

---

## 3. تعريفات الجداول

### 3.1 users

**الوصف:** مستخدمو النظام مع بيانات اعتماد المصادقة والأدوار وتتبع تسجيل الدخول.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف المستخدم الفريد | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| username | text | NOT NULL, UNIQUE | اسم مستخدم تسجيل الدخول | `admin` |
| password | text | NOT NULL | كلمة المرور المشفرة بـ bcrypt | `$2a$10$...` |
| full_name | text | NOT NULL | الاسم الكامل للمستخدم | `System Administrator` |
| email | text | NOT NULL | عنوان البريد الإلكتروني للمستخدم | `admin@sim.com` |
| role | user_role | NOT NULL, DEFAULT 'viewer' | دور المستخدم للتحكم بالوصول | `admin` |
| status | user_status | NOT NULL, DEFAULT 'active' | حالة الحساب | `active` |
| institution | text | NULLABLE | اسم المؤسسة المرتبطة | `National Bank of Ethiopia` |
| failed_login_attempts | integer | DEFAULT 0 | عداد محاولات تسجيل الدخول الفاشلة | `2` |
| locked_until | timestamp | NULLABLE | وقت انتهاء قفل الحساب | `2026-02-28T10:30:00Z` |
| last_login | timestamp | NULLABLE | آخر تسجيل دخول ناجح | `2026-02-28T09:00:00Z` |
| password_changed_at | timestamp | NULLABLE | آخر تغيير لكلمة المرور | `2026-02-28T00:00:00Z` |
| must_change_password | boolean | DEFAULT false | فرض تغيير كلمة المرور عند تسجيل الدخول التالي | `false` |
| mfa_secret | varchar | NULLABLE | سر TOTP MFA (مشفر بـ base32)؛ يُملأ عند إعداد MFA (ENT-01) | `JBSWY3DPEHPK3PXP` |
| mfa_enabled | boolean | DEFAULT false | ما إذا كان TOTP MFA مفعلاً للمستخدم (ENT-01) | `false` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء السجل | `2026-02-28T00:00:00Z` |

---

### 3.2 borrowers

**الوصف:** سجلات المقترضين الأفراد والشركات مع المعلومات الديموغرافية والوظيفية ومعلومات الشخصيات المعرضة سياسياً.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف المقترض الفريد | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| type | borrower_type | NOT NULL | فئة المقترض | `individual` |
| first_name | text | NULLABLE | الاسم الأول (المقترضون الأفراد) | `Abebe` |
| last_name | text | NULLABLE | اسم العائلة (المقترضون الأفراد) | `Bekele` |
| company_name | text | NULLABLE | اسم الشركة (المقترضون من الشركات) | `Ethio Telecom` |
| national_id | text | NOT NULL, UNIQUE | رقم الهوية الوطنية | `ETH-1234567890` |
| tin_number | text | NULLABLE | الرقم الضريبي | `TIN-9876543210` |
| date_of_birth | text | NULLABLE | تاريخ الميلاد (YYYY-MM-DD) | `1985-03-15` |
| gender | text | NULLABLE | الجنس | `male` |
| phone | text | NULLABLE | رقم الهاتف | `+251911234567` |
| email | text | NULLABLE | عنوان البريد الإلكتروني | `abebe@example.com` |
| address | text | NULLABLE | العنوان | `Bole Road, Addis Ababa` |
| country | text | NULLABLE | بلد الاختصاص القضائي | `Ethiopia` |
| city | text | NULLABLE | المدينة | `Addis Ababa` |
| region | text | NULLABLE | المنطقة/الولاية | `Addis Ababa` |
| employer_name | text | NULLABLE | صاحب العمل الحالي | `Ethiopian Airlines` |
| occupation | text | NULLABLE | المهنة/المسمى الوظيفي | `Engineer` |
| business_reg_number | text | NULLABLE | رقم السجل التجاري (للشركات) | `BR-2024-001` |
| sector | text | NULLABLE | قطاع الأعمال (للشركات) | `Technology` |
| passport_number | text | NULLABLE | رقم جواز السفر لتحديد الهوية العابرة للحدود | `EP1234567` |
| photo_url | text | NULLABLE | رابط/مسار صورة الملف الشخصي للمقترض (يتم إنشاؤها تلقائياً عبر DiceBear أو رفعها عبر multer) (ENT-12) | `/uploads/photos/abc123.jpg` |
| id_document_url | text | NULLABLE | رابط/مسار مسح وثيقة الهوية المرفوعة (جواز السفر، الهوية الوطنية) (ENT-12) | `/uploads/documents/def456.pdf` |
| is_pep | boolean | DEFAULT false | علامة الشخصية المعرضة سياسياً | `false` |
| pep_details | text | NULLABLE | تفاصيل الشخصية المعرضة سياسياً | `Former government minister` |
| related_borrower_id | varchar | NULLABLE | معرف المقترض المرتبط/المرتبط | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| relationship_type | text | NULLABLE | العلاقة بالمقترض المرتبط (spouse, guarantor, director, shareholder, beneficial_owner, subsidiary, parent_company) | `spouse` |
| education_level | text | NULLABLE | أعلى مستوى تعليمي | `bachelors` |
| education_institution | text | NULLABLE | اسم المؤسسة التعليمية | `Addis Ababa University` |
| employment_history | text | NULLABLE | تفاصيل التاريخ الوظيفي | `5 years at Ethiopian Airlines` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء السجل | `2026-02-28T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | طابع زمني لآخر تحديث | `2026-02-28T10:00:00Z` |

---

### 3.3 credit_accounts

**الوصف:** سجلات القروض والتسهيلات الائتمانية مع دعم العملات المتعددة وميزات القروض الخاصة وتتبع إعادة الهيكلة.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف الحساب الفريد | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | المقترض المرتبط | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| lender_institution | text | NOT NULL | اسم المؤسسة المقرضة | `Commercial Bank of Ethiopia` |
| account_number | text | NOT NULL | رقم الحساب/القرض | `ACC-2024-001234` |
| account_type | text | NOT NULL | نوع التسهيل الائتماني | `term_loan` |
| original_amount | decimal(15,2) | NOT NULL | المبلغ الأصلي المصروف | `500000.00` |
| current_balance | decimal(15,2) | NOT NULL | الرصيد القائم الحالي | `350000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | رمز العملة | `ETB` |
| interest_rate | decimal(5,2) | NULLABLE | نسبة الفائدة السنوية | `12.50` |
| disbursement_date | text | NULLABLE | تاريخ صرف القرض | `2024-01-15` |
| maturity_date | text | NULLABLE | تاريخ استحقاق القرض | `2029-01-15` |
| status | account_status | NOT NULL, DEFAULT 'current' | حالة الحساب | `current` |
| days_in_arrears | integer | DEFAULT 0 | عدد أيام التأخر | `0` |
| collateral_type | text | NULLABLE | نوع الضمان المقدم | `real_estate` |
| collateral_value | decimal(15,2) | NULLABLE | قيمة الضمان | `750000.00` |
| last_payment_date | text | NULLABLE | تاريخ آخر دفعة | `2026-02-28` |
| last_payment_amount | decimal(15,2) | NULLABLE | مبلغ آخر دفعة | `15000.00` |
| is_interest_free | boolean | DEFAULT false | علامة القرض بدون فائدة | `false` |
| grace_period_months | integer | NULLABLE | فترة السماح بالأشهر | `6` |
| restructure_count | integer | DEFAULT 0 | عدد مرات إعادة الهيكلة | `0` |
| written_off_date | text | NULLABLE | تاريخ شطب الحساب | `null` |
| reinstated_date | text | NULLABLE | تاريخ إعادة تفعيل الحساب | `null` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء السجل | `2026-02-28T00:00:00Z` |
| updated_at | timestamp | DEFAULT NOW() | طابع زمني لآخر تحديث | `2026-02-28T10:00:00Z` |

---

### 3.4 credit_inquiries

**الوصف:** سجلات فحوصات المراجع الائتمانية المنفذة على المقترضين.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف الاستعلام الفريد | `e5f6a7b8-c9d0-1234-ef01-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | المقترض المستعلم عنه | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| inquired_by | varchar | NOT NULL, FK -> users.id | المستخدم الذي أجرى الاستعلام | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| purpose | inquiry_purpose | NOT NULL | الغرض من الاستعلام الائتماني | `new_credit` |
| institution | text | NOT NULL | المؤسسة المستعلمة | `Commercial Bank of Ethiopia` |
| consent_provided | boolean | NOT NULL, DEFAULT false | ما إذا تم الحصول على موافقة المقترض | `true` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني للاستعلام | `2026-02-28T09:30:00Z` |

---

### 3.5 audit_logs

**الوصف:** سجل أنشطة غير قابل للتغيير لجميع عمليات النظام مع تتبع عنوان IP.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف إدخال السجل الفريد | `f6a7b8c9-d0e1-2345-f012-678901234567` |
| user_id | varchar | NULLABLE, FK -> users.id | المستخدم الذي نفذ الإجراء | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| action | text | NOT NULL | نوع الإجراء المنفذ | `LOGIN`, `CREATE`, `UPDATE`, `APPROVE` |
| entity | text | NOT NULL | نوع الكيان المتأثر | `user`, `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | معرف الكيان المتأثر | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| details | text | NULLABLE | تفاصيل الإجراء المقروءة | `Created user: John Doe` |
| ip_address | text | NULLABLE | عنوان IP للعميل | `192.168.1.100` |
| previous_hash | text | NULLABLE | تجزئة SHA-256 لإدخال سجل التدقيق السابق في سلسلة التجزئة (ENT-07)؛ `"genesis"` للإدخال الأول | `genesis` أو `a1b2c3d4...` |
| current_hash | text | NULLABLE | تجزئة SHA-256 لإدخال سجل التدقيق هذا المحسوبة من `previousHash` + `action` + `entity` + `details` + `timestamp` (ENT-07) | `e3b0c44298fc1c14...` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإدخال السجل | `2026-02-28T09:30:00Z` |

---

### 3.6 pending_approvals

**الوصف:** قائمة انتظار سير عمل الصانع-المدقق لموافقات تغيير البيانات.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف طلب الموافقة الفريد | `a7b8c9d0-e1f2-3456-0123-789012345678` |
| entity_type | text | NOT NULL | نوع الكيان الذي يتم تغييره | `borrower`, `credit_account` |
| entity_id | varchar | NULLABLE | معرف الكيان الحالي (للتحديثات) | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| action | text | NOT NULL | نوع التغيير المطلوب | `CREATE`, `UPDATE` |
| payload | text | NOT NULL | بيانات التغيير المتسلسلة بصيغة JSON | `{"firstName":"Abebe","lastName":"Bekele",...}` |
| requested_by | varchar | NOT NULL, FK -> users.id | المستخدم الذي قدم الطلب | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| reviewed_by | varchar | NULLABLE, FK -> users.id | المستخدم الذي راجع الطلب | `c3d4e5f6-a7b8-9012-cdef-345678901234` |
| status | approval_status | NOT NULL, DEFAULT 'pending' | حالة الموافقة الحالية | `pending` |
| review_notes | text | NULLABLE | ملاحظات/تعليقات المراجع | `Approved - verified documentation` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لتقديم الطلب | `2026-02-28T09:30:00Z` |
| reviewed_at | timestamp | NULLABLE | طابع زمني للمراجعة | `2026-02-28T10:00:00Z` |

---

### 3.7 disputes

**الوصف:** سجلات النزاعات والشكاوى مع تتبع اتفاقية مستوى الخدمة وتصنيف نوع التصحيح.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف النزاع الفريد | `b8c9d0e1-f2a3-4567-1234-890123456789` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | المقترض المقدم للنزاع | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| credit_account_id | varchar | NULLABLE, FK -> credit_accounts.id | الحساب الائتماني المرتبط | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| filed_by | varchar | NOT NULL, FK -> users.id | المستخدم الذي قدم النزاع | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| dispute_type | text | NOT NULL | فئة النزاع | `incorrect_balance`, `wrong_status`, `identity_error` |
| description | text | NOT NULL | وصف مفصل للنزاع | `Balance shows 500,000 ETB but should be 350,000 ETB` |
| status | dispute_status | NOT NULL, DEFAULT 'open' | حالة النزاع الحالية | `open` |
| resolution | text | NULLABLE | وصف الحل | `Balance corrected to 350,000 ETB` |
| correction_type | text | NULLABLE | تصحيح مالي أو غير مالي | `financial` |
| sla_deadline | timestamp | NULLABLE | الموعد النهائي لاتفاقية مستوى الخدمة (يومان مالي، 5 أيام غير مالي) | `2026-03-02T09:30:00Z` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لتقديم النزاع | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | طابع زمني لآخر تحديث | `2026-02-28T10:00:00Z` |
| resolved_at | timestamp | NULLABLE | طابع زمني للحل | `2026-02-28T14:00:00Z` |

---

### 3.8 notifications

**الوصف:** نظام إشعارات داخل التطبيق لطلبات الموافقة والنتائج وتنبيهات النظام.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف الإشعار الفريد | `c9d0e1f2-a3b4-5678-2345-901234567890` |
| user_id | varchar | NULLABLE, FK -> users.id | المستخدم المستهدف (null = بث عام) | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| type | text | NOT NULL | فئة الإشعار | `approval_pending`, `approval_result`, `dispute_filed` |
| title | text | NOT NULL | عنوان الإشعار | `New approval pending` |
| message | text | NOT NULL | نص الإشعار | `New borrower registration requires your review` |
| is_read | boolean | DEFAULT false | علامة حالة القراءة | `false` |
| link | text | NULLABLE | رابط التنقل | `/approvals` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني للإشعار | `2026-02-28T09:30:00Z` |

---

### 3.9 court_judgments

**الوصف:** الأحكام القضائية وحالات الإفلاس والامتيازات المرتبطة بالمقترضين (FR-COL-05).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف الحكم الفريد | `d0e1f2a3-b4c5-6789-3456-012345678901` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | المقترض المرتبط | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| case_number | text | NOT NULL | رقم مرجع القضية | `CASE-2024-5678` |
| court | text | NOT NULL | اسم المحكمة | `Federal High Court, Addis Ababa` |
| judgment_type | judgment_type | NOT NULL | نوع الحكم | `civil_judgment` |
| amount | decimal(15,2) | NULLABLE | مبلغ الحكم | `1000000.00` |
| currency | text | DEFAULT 'ETB' | عملة مبلغ الحكم | `ETB` |
| judgment_date | text | NOT NULL | تاريخ صدور الحكم | `2024-06-15` |
| status | judgment_status | NOT NULL, DEFAULT 'active' | حالة الحكم الحالية | `active` |
| description | text | NULLABLE | تفاصيل الحكم | `Civil judgment for unpaid commercial loan` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء السجل | `2026-02-28T09:30:00Z` |

---

### 3.10 consent_records

**الوصف:** إدارة موافقة صاحب البيانات مع أرقام الإيصالات (FR-CON-06/07).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف سجل الموافقة الفريد | `e1f2a3b4-c5d6-7890-4567-123456789012` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | المقترض المانح للموافقة | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| granted_to | text | NOT NULL | الجهة المستلمة للموافقة | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | الغرض من الموافقة | `credit_check`, `data_sharing` |
| consent_type | text | NOT NULL | نوع الموافقة | `one_time`, `recurring` |
| status | consent_status | NOT NULL, DEFAULT 'active' | حالة الموافقة الحالية | `active` |
| granted_at | timestamp | DEFAULT NOW() | طابع زمني لمنح الموافقة | `2026-02-28T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | طابع زمني لإلغاء الموافقة | `null` |
| receipt_number | text | NOT NULL | رقم إيصال الموافقة الفريد | `CR-1705312200000-abc123` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء السجل | `2026-02-28T09:30:00Z` |

---

### 3.11 payment_history

**الوصف:** سجل أداء المدفوعات لـ 12 فترة لكل حساب ائتماني (FR-CR-08).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف سجل الدفع الفريد | `f2a3b4c5-d6e7-8901-5678-234567890123` |
| credit_account_id | varchar | NOT NULL, FK -> credit_accounts.id | الحساب الائتماني المرتبط | `d4e5f6a7-b8c9-0123-def0-456789012345` |
| period | text | NOT NULL | فترة الدفع (بصيغة YYYY-MM) | `2026-02` |
| amount_due | decimal(15,2) | NOT NULL | المبلغ المستحق للفترة | `15000.00` |
| amount_paid | decimal(15,2) | NOT NULL | المبلغ المدفوع فعلياً | `15000.00` |
| status | payment_status | NOT NULL, DEFAULT 'on_time' | حالة الدفع للفترة | `on_time` |
| days_late | integer | DEFAULT 0 | عدد أيام تأخر الدفع | `0` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء السجل | `2026-02-28T09:30:00Z` |

---

### 3.12 institutions

**الوصف:** تسجيل مؤسسات مزودي البيانات مع سير عمل الموافقة (FR-DP-01/04).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف المؤسسة الفريد | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| name | text | NOT NULL | اسم المؤسسة | `Commercial Bank of Ethiopia` |
| type | text | NOT NULL | نوع المؤسسة | `bank`, `mfi`, `utility`, `telecom`, `digital_lender`, `sacco` |
| registration_number | text | NULLABLE | رقم التسجيل الرسمي | `REG-2024-001` |
| country | text | NOT NULL, DEFAULT 'Ethiopia' | بلد العمل | `Ethiopia` |
| contact_email | text | NULLABLE | عنوان البريد الإلكتروني للاتصال | `info@cbe.com.et` |
| contact_phone | text | NULLABLE | رقم هاتف الاتصال | `+251111234567` |
| address | text | NULLABLE | العنوان الفعلي | `Churchill Avenue, Addis Ababa` |
| status | institution_status | NOT NULL, DEFAULT 'pending' | حالة التسجيل | `active` |
| submission_frequency | text | DEFAULT 'monthly' | تكرار تقديم البيانات | `monthly` |
| approved_by | varchar | NULLABLE, FK -> users.id | المسؤول الذي وافق | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| approved_at | timestamp | NULLABLE | طابع زمني للموافقة | `2026-02-28T10:00:00Z` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني للتسجيل | `2026-02-28T00:00:00Z` |

---

### 3.13 billing_records

**الوصف:** إدارة الفوترة والرسوم للمؤسسات (FR-COMM-01/05).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف سجل الفوترة الفريد | `b4c5d6e7-f8a9-0123-7890-456789012345` |
| institution_name | text | NOT NULL | اسم المؤسسة المفوترة | `Commercial Bank of Ethiopia` |
| service_type | text | NOT NULL | نوع الخدمة المفوترة | `data_submission`, `credit_report`, `api_access`, `subscription` |
| amount | decimal(15,2) | NOT NULL | مبلغ الفاتورة | `50000.00` |
| currency | text | NOT NULL, DEFAULT 'ETB' | عملة الفاتورة | `ETB` |
| status | billing_status | NOT NULL, DEFAULT 'pending' | حالة الدفع | `pending` |
| invoice_number | text | NOT NULL | رقم الفاتورة الفريد | `INV-2025-001234` |
| period_start | text | NULLABLE | تاريخ بداية فترة الفوترة | `2026-02-28` |
| period_end | text | NULLABLE | تاريخ نهاية فترة الفوترة | `2026-02-28` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء الفاتورة | `2026-02-28T09:30:00Z` |

---

### 3.14 credit_report_logs

**الوصف:** سجلات إنشاء التقارير الائتمانية مع أرقام تسلسلية فريدة (FR-CR-06).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف السجل الفريد | `c5d6e7f8-a9b0-1234-8901-567890123456` |
| borrower_id | varchar | NOT NULL, FK -> borrowers.id | المقترض الذي تم إنشاء التقرير له | `b2c3d4e5-f6a7-8901-bcde-f23456789012` |
| requested_by | varchar | NOT NULL, FK -> users.id | المستخدم الذي طلب التقرير | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| institution | text | NOT NULL | المؤسسة الطالبة | `Commercial Bank of Ethiopia` |
| purpose | text | NOT NULL | الغرض من إنشاء التقرير | `new_credit` |
| serial_number | text | NOT NULL, UNIQUE | الرقم التسلسلي الفريد للتقرير | `CR-2025-M1A2B3C4` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء التقرير | `2026-02-28T09:30:00Z` |

---

### 3.15 api_keys

**الوصف:** إدارة مفاتيح API الخارجية مع تشفير SHA-256 ومستويات الأذونات وربط المؤسسات.

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | معرف سجل مفتاح API الفريد | `d6e7f8a9-b0c1-2345-9012-678901234567` |
| institution_id | varchar | NOT NULL, FK -> institutions.id | المؤسسة المرتبطة | `a3b4c5d6-e7f8-9012-6789-345678901234` |
| key_hash | text | NOT NULL | تجزئة SHA-256 لمفتاح API الكامل | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| key_prefix | text | NOT NULL | بادئة المفتاح المرئية للتعريف | `sim_a1b2c3d4` |
| label | text | NOT NULL | تسمية المفتاح المقروءة | `Production API Key` |
| status | api_key_status | NOT NULL, DEFAULT 'active' | حالة المفتاح | `active` |
| permissions | text | NOT NULL, DEFAULT 'submit' | مستوى الأذونات | `submit`, `read`, `full` |
| last_used_at | timestamp | NULLABLE | طابع زمني لآخر استخدام لـ API | `2026-02-28T14:30:00Z` |
| created_by | varchar | NOT NULL, FK -> users.id | المسؤول الذي أنشأ المفتاح | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني لإنشاء المفتاح | `2026-02-28T09:30:00Z` |
| revoked_at | timestamp | NULLABLE | طابع زمني لإلغاء المفتاح | `null` |

---

### 3.16 exchange_rates

**الوصف:** سجلات أسعار الصرف لدعم العملات المتعددة عبر جميع الاختصاصات الأفريقية الـ 54، ودعم أكثر من 42 عملة أفريقية بالإضافة إلى USD وEUR وGBP. يمكن إدخال الأسعار يدوياً أو جلبها مباشرة من open.er-api.com مع تحويل الأسعار المتقاطعة عبر توجيه USD (ENT-08).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | المعرف الفريد | `e7f8a9b0-c1d2-3456-0123-789012345678` |
| base_currency | text | NOT NULL | رمز العملة الأساسية (مثل USD) | `USD` |
| target_currency | text | NOT NULL | رمز العملة المستهدفة (مثل ETB) | `ETB` |
| rate | decimal(15,6) | NOT NULL | قيمة سعر الصرف | `56.123456` |
| effective_date | text | NOT NULL | تاريخ سريان السعر | `2026-03-01` |
| source | text | NOT NULL, DEFAULT 'manual' | مصدر السعر (manual, api, open.er-api.com) | `manual` |
| created_by | varchar | NULLABLE, FK -> users.id | المستخدم الذي أنشأ السعر | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني للإنشاء | `2026-02-28T09:30:00Z` |

---

### 3.17 retention_policies

**الوصف:** تكوين سياسة الاحتفاظ بالبيانات حسب الاختصاص القضائي ونوع الكيان، مع جدولة التنفيذ التلقائي. يدعم جميع الدول الأفريقية الـ 54 مع فترات احتفاظ خاصة بكل اختصاص قضائي (ENT-10).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | المعرف الفريد | `f8a9b0c1-d2e3-4567-1234-890123456789` |
| country | text | NOT NULL | الاختصاص القضائي (أي من الدول الأفريقية الـ 54) | `Ethiopia` |
| entity_type | text | NOT NULL | النوع: borrower, credit_account, audit_log, dispute, consent_record, court_judgment, payment_history | `borrower` |
| retention_years | integer | NOT NULL | السنوات قبل حذف السجل | `7` |
| archive_after_years | integer | NULLABLE | السنوات قبل أرشفة السجل | `5` |
| description | text | NULLABLE | وصف السياسة | `Retain borrower records for 7 years per NBE regulation` |
| is_active | boolean | DEFAULT true | ما إذا كانت السياسة نشطة | `true` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني للإنشاء | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | طابع زمني لآخر تحديث | `2026-02-28T10:00:00Z` |

---

### 3.18 api_configurations

**الوصف:** تكوين تكامل API الخارجي المركزي لخدمات الطقس والقضاء والدفع وأسعار الصرف والخدمات المخصصة. يوفر اختبار الاتصال وتتبع الحالة لجميع التكاملات المكونة (ENT-09).

| اسم الحقل | نوع البيانات | القيود | الوصف | قيمة مثال |
|-----------|-------------|--------|-------|-----------|
| id | varchar | PRIMARY KEY, DEFAULT gen_random_uuid() | المعرف الفريد | `a9b0c1d2-e3f4-5678-2345-901234567890` |
| name | text | NOT NULL | اسم التكوين | `Ethiopia Weather API` |
| category | text | NOT NULL | الفئة: weather, judicial, payment_gateway, exchange_rate, custom | `weather` |
| base_url | text | NOT NULL | رابط API الأساسي | `https://api.weather.example.com/v1` |
| api_key_header_name | text | DEFAULT 'X-API-Key' | اسم الترويسة لمفتاح API | `X-API-Key` |
| auth_type | text | NOT NULL | المصادقة: api_key, oauth2, bearer, basic, none | `api_key` |
| country | text | NULLABLE | البلد المستهدف أو "All" | `Ethiopia` |
| is_active | boolean | DEFAULT true | ما إذا كان التكوين نشطاً | `true` |
| description | text | NULLABLE | وصف التكوين | `Weather data for agricultural loan risk assessment` |
| last_tested_at | timestamp | NULLABLE | وقت آخر اختبار اتصال | `2026-02-28T14:00:00Z` |
| last_test_status | text | NULLABLE | نتيجة آخر اختبار (reachable, unreachable) | `reachable` |
| created_at | timestamp | DEFAULT NOW() | طابع زمني للإنشاء | `2026-02-28T09:30:00Z` |
| updated_at | timestamp | DEFAULT NOW() | طابع زمني لآخر تحديث | `2026-02-28T10:00:00Z` |

---

## 4. مخطط العلاقات (نصي)

```
users
  |
  +--< credit_inquiries (inquired_by -> users.id)
  +--< pending_approvals (requested_by -> users.id)
  +--< pending_approvals (reviewed_by -> users.id)
  +--< disputes (filed_by -> users.id)
  +--< notifications (user_id -> users.id)
  +--< audit_logs (user_id -> users.id)
  +--< credit_report_logs (requested_by -> users.id)
  +--< api_keys (created_by -> users.id)
  +--< institutions (approved_by -> users.id)
  +--< exchange_rates (created_by -> users.id)

borrowers
  |
  +--< credit_accounts (borrower_id -> borrowers.id)
  +--< credit_inquiries (borrower_id -> borrowers.id)
  +--< disputes (borrower_id -> borrowers.id)
  +--< court_judgments (borrower_id -> borrowers.id)
  +--< consent_records (borrower_id -> borrowers.id)
  +--< credit_report_logs (borrower_id -> borrowers.id)
  +--  borrowers (related_borrower_id -> borrowers.id) [self-referential]

credit_accounts
  |
  +--< payment_history (credit_account_id -> credit_accounts.id)
  +--< disputes (credit_account_id -> credit_accounts.id)

institutions
  |
  +--< api_keys (institution_id -> institutions.id)
```

**دليل الرموز:**
- `+--<` = علاقة واحد-إلى-متعدد (من الأصل إلى الفرع)
- `+--` = مرجع اختياري (ذاتي المرجع أو مفتاح خارجي قابل للإلغاء)

---

## 5. العملات المدعومة

يدعم النظام أكثر من 42 عملة أفريقية بالإضافة إلى 3 عملات احتياطية دولية، تغطي جميع الدول الأفريقية الـ 54.

### 5.1 العملات الاحتياطية الدولية

| الرمز | اسم العملة | الاختصاصات |
|-------|-----------|-----------|
| USD | الدولار الأمريكي | الكل |
| EUR | اليورو | الكل |
| GBP | الجنيه الإسترليني | الكل |

### 5.2 عملات غرب أفريقيا (ECOWAS)

| الرمز | اسم العملة | البلد/المنطقة |
|-------|-----------|-------------|
| NGN | النيرة النيجيرية | نيجيريا |
| GHS | السيدي الغاني | غانا |
| XOF | فرنك غرب أفريقيا CFA | بنين، بوركينا فاسو، ساحل العاج، غينيا بيساو، مالي، النيجر، السنغال، توغو |
| LRD | الدولار الليبيري | ليبيريا |
| SLL | الليون السيراليوني | سيراليون |
| GMD | الدالاسي الغامبي | غامبيا |
| GNF | الفرنك الغيني | غينيا |
| CVE | الإسكودو الرأسفيردي | الرأس الأخضر |

### 5.3 عملات شرق أفريقيا (EAC)

| الرمز | اسم العملة | البلد/المنطقة |
|-------|-----------|-------------|
| KES | الشلن الكيني | كينيا |
| UGX | الشلن الأوغندي | أوغندا |
| TZS | الشلن التنزاني | تنزانيا |
| RWF | الفرنك الرواندي | رواندا |
| BIF | الفرنك البوروندي | بوروندي |
| ETB | البر الإثيوبي | إثيوبيا |
| SSP | الجنيه الجنوب سوداني | جنوب السودان |
| SDG | الجنيه السوداني | السودان |
| SOS | الشلن الصومالي | الصومال |
| DJF | الفرنك الجيبوتي | جيبوتي |
| ERN | الناكفا الإريتري | إريتريا |

### 5.4 عملات جنوب أفريقيا (SADC)

| الرمز | اسم العملة | البلد/المنطقة |
|-------|-----------|-------------|
| ZAR | الراند الجنوب أفريقي | جنوب أفريقيا، ليسوتو، إسواتيني، ناميبيا |
| BWP | البولا البوتسواني | بوتسوانا |
| MWK | الكواشا الملاوي | ملاوي |
| ZMW | الكواشا الزامبي | زامبيا |
| MZN | الميتيكال الموزمبيقي | موزمبيق |
| AOA | الكوانزا الأنغولي | أنغولا |
| MGA | الأرياري المدغشقري | مدغشقر |
| MUR | الروبية الموريشية | موريشيوس |
| SCR | الروبية السيشلية | سيشل |
| KMF | الفرنك القمري | جزر القمر |
| ZWL | الدولار الزيمبابوي | زيمبابوي |
| LSL | اللوتي الليسوتي | ليسوتو |
| NAD | الدولار الناميبي | ناميبيا |
| SZL | الليلانجيني الإسواتيني | إسواتيني |

### 5.5 عملات وسط أفريقيا (CEMAC)

| الرمز | اسم العملة | البلد/المنطقة |
|-------|-----------|-------------|
| XAF | فرنك وسط أفريقيا CFA | الكاميرون، جمهورية أفريقيا الوسطى، تشاد، جمهورية الكونغو، غينيا الاستوائية، الغابون |
| CDF | الفرنك الكونغولي | جمهورية الكونغو الديمقراطية |
| STN | دوبرا ساو تومي وبرينسيبي | ساو تومي وبرينسيبي |

### 5.6 عملات شمال أفريقيا (AMU)

| الرمز | اسم العملة | البلد/المنطقة |
|-------|-----------|-------------|
| EGP | الجنيه المصري | مصر |
| MAD | الدرهم المغربي | المغرب |
| TND | الدينار التونسي | تونس |
| DZD | الدينار الجزائري | الجزائر |
| LYD | الدينار الليبي | ليبيا |
| MRU | الأوقية الموريتانية | موريتانيا |

---

## 6. ملخص الفهارس

| الجدول | الأعمدة المفهرسة | نوع الفهرس |
|--------|-----------------|-----------|
| users | id (PK), username (UNIQUE) | B-tree |
| borrowers | id (PK), national_id (UNIQUE) | B-tree |
| credit_accounts | id (PK), borrower_id (FK) | B-tree |
| credit_inquiries | id (PK), borrower_id (FK), inquired_by (FK) | B-tree |
| audit_logs | id (PK), user_id (FK) | B-tree |
| pending_approvals | id (PK), requested_by (FK), reviewed_by (FK) | B-tree |
| disputes | id (PK), borrower_id (FK), credit_account_id (FK), filed_by (FK) | B-tree |
| notifications | id (PK), user_id (FK) | B-tree |
| court_judgments | id (PK), borrower_id (FK) | B-tree |
| consent_records | id (PK), borrower_id (FK) | B-tree |
| payment_history | id (PK), credit_account_id (FK) | B-tree |
| institutions | id (PK), approved_by (FK) | B-tree |
| billing_records | id (PK) | B-tree |
| credit_report_logs | id (PK), borrower_id (FK), requested_by (FK), serial_number (UNIQUE) | B-tree |
| api_keys | id (PK), institution_id (FK), created_by (FK) | B-tree |
| exchange_rates | id (PK), created_by (FK) | B-tree |
| retention_policies | id (PK) | B-tree |
| api_configurations | id (PK) | B-tree |
