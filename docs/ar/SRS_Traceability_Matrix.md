# مصفوفة تتبع متطلبات مواصفات البرمجيات (SRS)

## نظام مركز البيانات المركزي العابر للحدود وسجل الائتمان الإصدار 2.5

**مُعد لصالح:** Systems In Motion Limited  
**إصدار الوثيقة:** 2.5  
**التاريخ:** أبريل 2026

---

## 1. الغرض

تربط هذه الوثيقة كل متطلب من متطلبات مواصفات البرمجيات (SRS) بحالة تنفيذه داخل نظام سجل الائتمان. وتوفر إمكانية التتبع من المتطلبات عبر التنفيذ وصولاً إلى حالات اختبار القبول من قبل المستخدم (UAT).

---

## 2. دليل التتبع

| الحالة | الوصف |
|--------|-------|
| Implemented | تم التنفيذ بالكامل وهو وظيفي |
| Partial | تم التنفيذ جزئياً مع ملاحظات على القيود |
| Not Implemented | لم يتم التنفيذ بعد |

---

## 3. متطلبات جمع البيانات (FR-COL)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-COL-01 | يجب على النظام جمع البيانات الديموغرافية للمقترض (الاسم، تاريخ الميلاد، الجنس، الرقم الوطني، جواز السفر، الرقم الضريبي، العنوان، الهاتف، البريد الإلكتروني) | Implemented | Borrower Management (`borrowers` table, `borrowers.tsx`) | يتم التقاط جميع الحقول الديموغرافية في نموذج تسجيل المقترض؛ يدعم الأنواع الفردية والمؤسسية | TC-BOR-001 إلى TC-BOR-005 |
| FR-COL-02 | يجب على النظام جمع بيانات حسابات الائتمان (نوع الحساب، المبالغ، التواريخ، الحالة، الضمانات، المتأخرات) | Implemented | Credit Accounts (`credit_accounts` table, `credit-accounts.tsx`) | إنشاء كامل لحساب الائتمان بجميع الحقول المطلوبة بما في ذلك العملات المتعددة والقروض بدون فوائد وفترة السماح وتتبع إعادة الهيكلة | TC-CA-001 إلى TC-CA-005 |
| FR-COL-03 | يجب على النظام دعم استيعاب البيانات بالجملة (JSON/CSV) | Implemented | Batch Upload (`batch-upload.tsx`, `/api/batch-upload/credit-accounts`) | رفع ملفات JSON وCSV مع التحقق من صحة كل سجل وتقرير الأخطاء | TC-BATCH-001 إلى TC-BATCH-004 |
| FR-COL-04 | يجب على النظام التحقق من جودة البيانات عند نقطة الإدخال | Implemented | Server Routes (`routes.ts`), Zod Schemas (`schema.ts`) | التحقق من المخططات باستخدام Zod على جميع عمليات الإدراج؛ فرض القيود على مستوى الحقول | TC-DQ-001, TC-DQ-002 |
| FR-COL-05 | يجب على النظام جمع معلومات الأحكام القضائية والرهون | Implemented | Court Judgments (`court_judgments` table, `borrower-detail.tsx`) | أحكام قضائية مع رقم القضية والمحكمة والنوع (lien/bankruptcy/lawsuit/civil/criminal) والمبلغ والتاريخ والحالة | TC-CJ-001 إلى TC-CJ-003 |
| FR-COL-06 | تحليل الكيانات عبر الحدود | جواز السفر، الرقم الضريبي، المطابقة الضبابية للأسماء لتحديد الهوية عبر الولايات القضائية | shared/schema.ts, server/storage.ts | 7 أنواع من العلاقات بما في ذلك beneficial_owner | TC-BOR-013 |
| FR-COL-07 | يجب على النظام دعم رفع صور الهوية والوثائق للمقترضين | Implemented | Borrower Management (`photoUrl`, `idDocumentUrl` fields, multer upload endpoints, auth-protected serving) | رفع الصور (حد 5 ميجابايت، صور فقط) ورفع وثائق الهوية (حد 10 ميجابايت، صور/PDF) مع أسماء ملفات عشوائية؛ يتم تقديم الملفات عبر مسار `/uploads` المحمي بالمصادقة | TC-PHOTO-001 إلى TC-PHOTO-003 |
| FR-COL-08 | يجب على النظام توفير بحث عالمي عبر الكيانات للمقترضين والمؤسسات وحسابات الائتمان | Implemented | Global Search (`/api/global-search`, `credit-search.tsx`) | البحث في المقترضين والمؤسسات وحسابات الائتمان في وقت واحد مع فلتر اختياري للدولة | TC-GS-001, TC-GS-002 |

---

## 4. متطلبات تقارير الائتمان (FR-CR)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-CR-01 | يجب على النظام إنشاء تقارير ائتمانية مع ملخص المقترض | Implemented | Credit Report (`credit-report.tsx`, `/api/borrowers/:id/credit-report`) | تقرير ائتماني كامل مع المعلومات الشخصية وملخص الحساب وتحليل النقاط وتاريخ الدفع | TC-CR-001, TC-CR-002 |
| FR-CR-02 | يجب على النظام حساب درجات الائتمان (نطاق 300-850) | Implemented | Credit Report Generation (`routes.ts`, `external-api.ts`) | تسجيل خوارزمي بناءً على تاريخ الدفع والتأخرات والتخلف عن السداد وشطب الديون والاستعلامات | TC-CR-003 |
| FR-CR-03 | يجب على النظام دعم فحوصات مراجع الائتمان بالجملة | Implemented | Credit Search (`credit-search.tsx`, `/api/credit-search/bulk`) | بحث دفعي متعدد المعرفات مع تجميع النتائج | TC-CS-003 |
| FR-CR-04 | يجب على النظام تتبع استعلامات الائتمان مع الموافقة | Implemented | Credit Inquiries (`credit_inquiries` table) | تسجيل الاستعلامات مع الغرض والمؤسسة وعلم الموافقة | TC-CS-001, TC-CS-002 |
| FR-CR-05 | يجب على النظام دعم أغراض استعلام متعددة | Implemented | Credit Inquiries (`inquiryPurposeEnum`) | يدعم: new_credit, review, collection, regulatory, portfolio_monitoring | TC-CS-001 |
| FR-CR-06 | يجب على النظام تعيين أرقام تسلسلية فريدة لتقارير الائتمان | Implemented | Credit Report Logs (`credit_report_logs` table, `/api/credit-reports/generate`) | التنسيق: CR-{YEAR}-{timestamp_base36}؛ رقم تسلسلي فريد لكل تقرير | TC-CR-004 |
| FR-CR-07 | يجب على النظام تضمين رموز الأسباب في تقارير الائتمان | Implemented | Credit Report (`credit-report.tsx`, scoring logic) | 10 رموز أسباب: DELINQUENT_ACCOUNTS, WRITTEN_OFF_ACCOUNTS, RESTRUCTURED_ACCOUNTS, HIGH_INQUIRY_VOLUME, HIGH_DEBT_LEVEL, COURT_JUDGMENTS_PRESENT, POLITICALLY_EXPOSED_PERSON, STRONG_REPAYMENT_HISTORY, EXCELLENT_PAYMENT_RECORD, THIN_FILE_LIMITED_HISTORY | TC-CR-005 |
| FR-CR-08 | يجب على النظام الاحتفاظ بتاريخ أداء الدفع لمدة 12 فترة | Implemented | Payment History (`payment_history` table, borrower detail) | شبكة دفع من 12 فترة مع تتبع الحالة (on_time, late, missed, partial) | TC-CR-006 |

---

## 5. متطلبات الموافقة والنزاعات (FR-CON)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-CON-01 | يجب على النظام إدارة موافقة أصحاب البيانات | Implemented | Consent Management (`consent_records` table, `consent-management.tsx`) | منح/إلغاء الموافقة مع النوع والغرض والجهة الممنوح لها | TC-CON-001 |
| FR-CON-02 | يجب على النظام توفير بوابة وحدة خدمة الاستعلامات (مكتب المساعدة) | Implemented | Helpdesk (`helpdesk.tsx`) | بوابة موجهة للمستهلك لتقديم النزاعات وإدارة الموافقات والبحث عن المقترضين | TC-HD-001 إلى TC-HD-004 |
| FR-CON-03 | يجب على النظام تتبع حالة الموافقة (نشطة/ملغاة) | Implemented | Consent Records (`consentStatusEnum`) | حالة نشطة/ملغاة مع طابع زمني للإلغاء | TC-CON-002 |
| FR-CON-04 | يجب على النظام دعم تقديم وتتبع النزاعات | Implemented | Disputes (`disputes` table, `disputes.tsx`) | دورة حياة النزاع الكاملة: open, under_review, resolved, rejected | TC-DIS-001, TC-DIS-002 |
| FR-CON-05 | يجب على النظام تصنيف النزاعات حسب نوع التصحيح | Implemented | Disputes (`correctionType` field) | أنواع تصحيح مالية وغير مالية مع جداول زمنية مختلفة لاتفاقية مستوى الخدمة | TC-DIS-003 |
| FR-CON-06 | يجب على النظام إنشاء أرقام إيصالات الموافقة | Implemented | Consent Records (`receiptNumber` field) | التنسيق: CR-{timestamp}-{random}؛ إيصال فريد لكل منح موافقة | TC-CON-003 |
| FR-CON-07 | يجب على النظام دعم إلغاء الموافقة | Implemented | Consent Management (`/api/consent-records/:id/revoke`) | الإلغاء مع تسجيل الطابع الزمني | TC-CON-004 |
| FR-CON-08 | يجب على النظام السماح لمكتب المساعدة بتقديم النزاعات نيابة عن المستهلكين | Implemented | Helpdesk (`helpdesk.tsx`) | تقديم النزاعات من واجهة مكتب المساعدة مع سياق المقترض | TC-HD-003 |
| FR-CON-09 | يجب على النظام السماح لمكتب المساعدة بمنح الموافقة نيابة عن المستهلكين | Implemented | Helpdesk (`helpdesk.tsx`) | منح الموافقة من واجهة مكتب المساعدة مع سياق المقترض | TC-HD-004 |

---

## 6. المتطلبات التنظيمية (FR-REG)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-REG-01 | يجب على النظام توفير تحليلات تنظيمية (نسب القروض المتعثرة، تفصيلات المحفظة) | Implemented | Reports (`reports.tsx`, `/api/reports/regulatory`) | نسب القروض المتعثرة وتفصيلات المحفظة حسب المؤسسة ونوع القرض وتتبع انتهاكات اتفاقية مستوى الخدمة | TC-RPT-001, TC-RPT-002 |
| FR-REG-02 | يجب على النظام دعم دور المستخدم التنظيمي مع صلاحيات الوصول المناسبة | Implemented | RBAC (`userRoleEnum`, route middleware) | دور المنظم مع الوصول إلى سجلات التدقيق والفوترة والموافقات والتحليلات | TC-AUTH-005 |
| FR-REG-03 | يجب على النظام فرض سير عمل المُعد-المُراجع لتغييرات البيانات | Implemented | Pending Approvals (`pending_approvals` table, `pending-approvals.tsx`) | مبدأ العيون الأربع: يجب أن يوافق مستخدم مختلف؛ يتم فرض منع الموافقة الذاتية من جانب الخادم | TC-MC-001 إلى TC-MC-004 |

---

## 7. متطلبات القروض الخاصة (FR-SPEC)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-SPEC-01 | يجب على النظام دعم منتجات القروض بدون فوائد | Implemented | Credit Accounts (`isInterestFree` field) | علم منطقي على حسابات الائتمان؛ يتم إخفاء معدل الفائدة عندما يكون القرض بدون فوائد | TC-CA-003 |
| FR-SPEC-02 | يجب على النظام دعم تتبع فترة السماح | Implemented | Credit Accounts (`gracePeriodMonths` field) | حقل عدد صحيح لفترة السماح بالأشهر | TC-CA-003 |
| FR-SPEC-03 | يجب على النظام تتبع عدد مرات إعادة هيكلة القرض | Implemented | Credit Accounts (`restructureCount` field) | عداد عدد صحيح لعدد مرات إعادة الهيكلة | TC-CA-004 |
| FR-SPEC-04 | يجب على النظام تتبع تاريخ الشطب | Implemented | Credit Accounts (`writtenOffDate` field) | حقل تاريخ يتم ملؤه عندما تكون حالة الحساب written_off | TC-CA-004 |
| FR-SPEC-05 | يجب على النظام تتبع تاريخ إعادة التفعيل | Implemented | Credit Accounts (`reinstatedDate` field) | حقل تاريخ للحسابات المعاد تفعيلها بعد الشطب | TC-CA-004 |

---

## 8. المتطلبات التجارية (FR-COMM)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-COMM-01 | يجب على النظام دعم إدارة الفوترة والرسوم | Implemented | Billing (`billing_records` table, `billing.tsx`) | إنشاء الفواتير مع نوع الخدمة والمبلغ والعملة والفترة | TC-BIL-001, TC-BIL-002 |
| FR-COMM-02 | يجب على النظام تتبع حالة دفع الفاتورة | Implemented | Billing Records (`billingStatusEnum`) | تتبع الحالة: pending, paid, overdue | TC-BIL-003 |
| FR-COMM-03 | يجب على النظام دعم أنواع خدمات متعددة | Implemented | Billing Records (`serviceType` field) | أنواع الخدمات: data_submission, credit_report, api_access, subscription | TC-BIL-001 |
| FR-COMM-04 | يجب على النظام دعم الفوترة متعددة العملات | Implemented | Billing Records (`currency` field) | أكثر من 42 عملة أفريقية بالإضافة إلى USD وEUR وGBP عبر 54 ولاية قضائية | TC-BIL-001 |
| FR-COMM-05 | يجب على النظام إنشاء أرقام فواتير فريدة | Implemented | Billing (`invoiceNumber` field) | أرقام فواتير فريدة لكل سجل فوترة | TC-BIL-002 |

---

## 9. متطلبات مزودي البيانات (FR-DP)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| FR-DP-01 | يجب على النظام دعم تسجيل المؤسسات مع سير عمل الموافقة | Implemented | Institutions (`institutions` table, `institutions.tsx`) | التسجيل الذاتي مع موافقة المسؤول؛ الأنواع: bank, mfi, utility, telecom, digital_lender, sacco | TC-INST-001, TC-INST-002 |
| FR-DP-02 | يجب على النظام تكوين تكرار تقديم المؤسسة | Implemented | Institutions (`submissionFrequency` field) | قابل للتكوين: monthly (افتراضي) | TC-INST-003 |
| FR-DP-03 | يجب على النظام تتبع حالة المؤسسة | Implemented | Institutions (`institutionStatusEnum`) | الحالة: pending, active, suspended | TC-INST-002 |
| FR-DP-04 | يجب على النظام طلب موافقة المسؤول لتفعيل المؤسسة | Implemented | Institutions (`/api/institutions/:id/approve`) | نقطة نهاية موافقة للمسؤول فقط مع تتبع الموافق والطابع الزمني | TC-INST-002 |

---

## 10. متطلبات التكامل والتقارير (INT-RPT)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| INT-RPT-01 | يجب على النظام دعم تصدير البيانات بتنسيق CSV | Implemented | Reports (`/api/reports/export?format=csv`) | تصدير بيانات المحفظة والمقترضين بتنسيق CSV | TC-RPT-003 |
| INT-RPT-02 | يجب على النظام توفير واجهة برمجة تطبيقات REST خارجية لتقديم البيانات | Implemented | External API (`external-api.ts`) | واجهة REST كاملة مع مصادقة X-API-Key؛ المقترضون وحسابات الائتمان وتاريخ الدفع والأحكام القضائية | TC-API-001 إلى TC-API-005 |
| INT-RPT-03 | يجب على النظام دعم التقديم الدفعي عبر واجهة برمجة التطبيقات | Implemented | External API (`external-api.ts`) | تقديم دفعي قائم على المصفوفات للمقترضين وحسابات الائتمان وتاريخ الدفع | TC-API-004 |
| INT-RPT-04 | يجب على النظام توفير تقارير تحليلية تنظيمية | Implemented | Reports (`/api/reports/regulatory`, `reports.tsx`) | نسب القروض المتعثرة وتحليلات المحفظة وتتبع انتهاكات اتفاقية مستوى الخدمة | TC-RPT-002 |

---

## 11. متطلبات جودة البيانات (DQ)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| DQ-01 | يجب على النظام التحقق من صحة البيانات عند نقطة الإدخال | Implemented | Zod Schemas (`schema.ts`), Routes (`routes.ts`) | التحقق القائم على المخططات على جميع نقاط نهاية واجهة برمجة التطبيقات باستخدام drizzle-zod | TC-DQ-001 |
| DQ-02 | يجب على النظام فرض معرفات فريدة (الرقم الوطني، الرقم الضريبي) | Implemented | Database Constraints (`borrowers.nationalId` unique) | قيد فريد على nationalId؛ فرض على مستوى قاعدة البيانات | TC-DQ-002 |
| DQ-03 | يجب على النظام توفير تقرير أخطاء جودة البيانات | Implemented | Batch Upload (`batch-upload.tsx`) | أخطاء التحقق لكل سجل مع تفصيل على مستوى الحقل | TC-BATCH-003 |
| DQ-04 | يجب على النظام فرض اتفاقية مستوى خدمة مدتها يومي عمل للنزاعات المالية | Implemented | Disputes (`createDispute` in `storage.ts`) | حساب تلقائي للموعد النهائي لاتفاقية مستوى الخدمة: يومان لنوع التصحيح المالي | TC-DIS-003 |
| DQ-05 | يجب على النظام فرض اتفاقية مستوى خدمة مدتها 5 أيام عمل للنزاعات غير المالية | Implemented | Disputes (`createDispute` in `storage.ts`) | حساب تلقائي للموعد النهائي لاتفاقية مستوى الخدمة: 5 أيام لنوع التصحيح غير المالي | TC-DIS-003 |

---

## 12. متطلبات الأمان غير الوظيفية (NFR-SEC)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| NFR-SEC-01 | يجب على النظام تنفيذ التحكم في الوصول القائم على الأدوار (4 أدوار) | Implemented | RBAC (`userRoleEnum`, `requireRole` middleware) | 4 أدوار: admin, regulator, lender, viewer؛ فرض من جانب الخادم على جميع المسارات المحمية | TC-AUTH-005, TC-AUTH-006 |
| NFR-SEC-02 | يجب على النظام تجزئة كلمات المرور باستخدام bcrypt | Implemented | Authentication (`bcryptjs` in `routes.ts`) | bcrypt مع 10 جولات ملح؛ تجزئة كلمة المرور عند الإنشاء والتغيير | TC-AUTH-001 |
| NFR-SEC-03 | يجب على النظام فرض تعقيد كلمة المرور (8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، حرف خاص) | Implemented | Password Change (`/api/auth/change-password`) | التحقق بالتعبير النمطي: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/` | TC-AUTH-007 |
| NFR-SEC-04 | يجب على النظام قفل الحسابات بعد 3 محاولات تسجيل دخول فاشلة | Implemented | Login (`/api/auth/login`) | حد 3 محاولات؛ فترة قفل 15 دقيقة؛ إعادة تعيين العداد عند تسجيل الدخول الناجح | TC-AUTH-002, TC-AUTH-003 |
| NFR-SEC-05 | يجب على النظام الاحتفاظ بسجلات تدقيق شاملة | Implemented | Audit Logging (`audit_logs` table, `audit-trail.tsx`) | تسجيل جميع عمليات CRUD مع userId والإجراء والكيان والتفاصيل وعنوان IP والطابع الزمني | TC-AUDIT-001, TC-AUDIT-002 |
| NFR-SEC-06 | يجب على النظام تتبع عناوين IP في سجلات التدقيق | Implemented | Audit Logging (`ipAddress` field) | التقاط IP من `req.ip` على جميع العمليات المراقبة | TC-AUDIT-003 |
| NFR-SEC-07 | يجب على النظام فرض مبدأ المُعد-المُراجع (مبدأ العيون الأربع) | Implemented | Pending Approvals (`routes.ts` self-approval check) | فرض من جانب الخادم: `requestedBy !== reviewedBy`؛ خطأ 403 عند محاولة الموافقة الذاتية | TC-MC-004 |
| NFR-SEC-08 | يجب على النظام فرض انتهاء صلاحية كلمة المرور كل 90 يوماً | Implemented | Login/Auth (`passwordChangedAt`, `mustChangePassword`) | فحص عمر كلمة المرور عند تسجيل الدخول؛ حوار تغيير إجباري عند انتهاء الصلاحية | TC-AUTH-008 |
| NFR-SEC-09 | يجب على النظام فرض مهلة جلسة خمول مدتها 15 دقيقة | Implemented | Session Middleware (`server/index.ts`) | `IDLE_TIMEOUT_MS = 15 * 60 * 1000`؛ تدمير تلقائي للجلسة؛ إرجاع رمز الحالة 440 | TC-AUTH-004 |
| NFR-SEC-10 | حماية SSRF | التحقق من عناوين URL وحظر أسماء المضيفات في نقطة نهاية اختبار واجهة برمجة التطبيقات | server/routes.ts | حظر عناوين IP الخاصة ونقاط نهاية البيانات الوصفية | TC-SEC-010 |

---

## 13. متطلبات التحسينات المؤسسية (ENT)

| مرجع SRS | وصف المتطلب | الحالة | الوحدة/المكون | ملاحظات التنفيذ | حالة اختبار UAT |
|-----------|-------------|--------|---------------|-----------------|-----------------|
| ENT-01 | يجب على النظام دعم المصادقة متعددة العوامل القائمة على TOTP | Implemented | MFA (`mfaSecret`, `mfaEnabled` on `users`; `mfa-setup.tsx`; `/api/auth/mfa/*`) | TOTP عبر مكتبة `otpauth`؛ الإعداد يعيد URI لرمز QR؛ نقاط نهاية التحقق/التعطيل/تسجيل الدخول؛ يعيد تسجيل الدخول علم `requireMfa` عند التمكين؛ ترجمة EN وFR وPT | TC-ENT-001 إلى TC-ENT-005 |
| ENT-02 | يجب على النظام إجراء مطابقة ضبابية للكيانات للكشف عن المقترضين المحتملين المكررين | Implemented | Fuzzy Matching (`pg_trgm` extension; `fuzzyMatchBorrowers` in `storage.ts`; `/api/borrowers/fuzzy-match`) | تشابه المثلثات في PostgreSQL عبر `pg_trgm`؛ عتبة ≥ 0.3؛ تحذير التكرار يظهر في نموذج تسجيل المقترض | TC-ENT-006, TC-ENT-007 |
| ENT-03 | يجب على النظام توفير مساعد روبوت محادثة موجه لتقديم النزاعات | Implemented | Dispute Chatbot (`dispute-chatbot.tsx`; `helpdesk.tsx`) | تدفق موجه متعدد الخطوات: نوع المشكلة ← بحث المقترض ← اختيار الحساب ← الوصف ← التقديم التلقائي؛ ترجمة EN وFR وPT | TC-ENT-008 إلى TC-ENT-010 |
| ENT-04 | يجب على النظام دعم مصادقة رمز Bearer الحامل وفق OAuth 2.1 لواجهة برمجة التطبيقات الخارجية | Implemented | OAuth 2.1 (`/api/external/oauth/token`; `external-api.ts`; `api-docs.tsx`) | منح بيانات اعتماد العميل؛ رموز JWT Bearer إلى جانب X-API-Key؛ مكتبة `jsonwebtoken`؛ موثق في صفحة وثائق واجهة برمجة التطبيقات | TC-ENT-011 إلى TC-ENT-013 |
| ENT-05 | يجب على النظام تنفيذ تحسينات النطاق الترددي المنخفض (الضغط، تقسيم الشفرة) | Implemented | Performance (`compression` middleware in `server/index.ts`; `React.lazy` in `App.tsx`) | ضغط gzip لجميع استجابات HTTP؛ مكونات المسارات المحملة بالتأجيل مع مؤشر تحميل `Suspense` | TC-ENT-014, TC-ENT-015 |
| ENT-06 | يجب على النظام دعم تنسيق ملفات XBRL/XML للرفع الدفعي للبيانات | Implemented | XBRL Upload (`batch-upload.tsx` XBRL tab; `/api/batch-upload/credit-accounts`) | تحليل XBRL/XML في نقطة نهاية الرفع الدفعي؛ واجهة مبوبة (JSON/CSV وXBRL)؛ نموذج تنسيق مقدم | TC-ENT-016, TC-ENT-017 |
| ENT-07 | يجب على النظام تنفيذ سجلات تدقيق مقاومة للتلاعب مع سلسلة تجزئة SHA-256 | Implemented | Audit Integrity (`previousHash`, `currentHash` on `audit_logs`; `verifyAuditIntegrity` in `storage.ts`; `/api/audit/verify-integrity`; `audit-trail.tsx`) | كل إدخال سجل مجزأ بـ SHA-256 مرتبط بالإدخال السابق؛ نقطة نهاية التحقق من السلامة؛ شارة مرئية في صفحة مسار التدقيق | TC-ENT-018 إلى TC-ENT-020 |
| ENT-08 | فرض الاحتفاظ بالبيانات (REQ-RET-01) | أرشفة/حذف تلقائي بناءً على سياسات محددة لكل ولاية قضائية | server/retention-enforcement.ts, client/src/pages/retention-policies.tsx | جدولة كل 24 ساعة + تشغيل يدوي | TC-RET-001 |
| ENT-09 | وحدة إدارة أسعار الصرف | إدارة CRUD للمسؤول لأزواج أسعار العملات المتقاطعة مع توجيه USD | client/src/pages/exchange-rates.tsx, server/routes.ts | 18 عملة، أداة تحويل | TC-EXR-001 |
| ENT-10 | وحدة إدارة واجهة برمجة التطبيقات | تكوين مركزي لنقاط نهاية الخدمات الخارجية | client/src/pages/api-admin.tsx, server/routes.ts | الطقس، القضاء، بوابة الدفع | TC-API-ADM-001 |
| ENT-11 | البحث العالمي عبر الكيانات | Implemented | Global Search (`/api/global-search`, `credit-search.tsx`) | البحث عبر المقترضين والمؤسسات وحسابات الائتمان مع فلتر اختياري للدولة؛ لا تغييرات في المخطط مطلوبة | TC-GS-001, TC-GS-002 |
| ENT-12 | رفع صور الهوية والوثائق للمقترضين | Implemented | ID Photos (`photoUrl`, `idDocumentUrl` fields on `borrowers`, multer upload endpoints) | صور رمزية تلقائية من DiceBear كافتراضي؛ رفع صور/وثائق عبر multer مع تقديم محمي بالمصادقة | TC-PHOTO-001 إلى TC-PHOTO-003 |
| ENT-13 | بيئة العرض التوضيحي للمستثمرين | Implemented | Demo Environment (login page demo cards, DEMO banner) | تسجيل دخول تجريبي بنقرة واحدة مع 3 بطاقات أدوار (مسؤول، منظم، مسؤول بنك)؛ شعار DEMO ENVIRONMENT باللون الكهرماني؛ إخلاء مسؤولية البيانات الوهمية | TC-DEMO-001, TC-DEMO-002 |
| ENT-14 | التحليلات المرئية للوحة المعلومات | Implemented | Dashboard Charts (`dashboard-charts.tsx`, `africa-map.tsx`, `routes.ts`) | رسوم بيانية تفاعلية (رسم مساحي للاتجاهات، رسم دائري مفرغ لتوزيع الحالات، رسم أفقي شريطي لأنواع القروض) وخريطة SVG choropleth لأفريقيا بتلوين حراري حسب عدد المقترضين عبر جميع الدول الـ 54؛ بيانات فورية عبر `GET /api/dashboard/chart-data` (محمية بالمصادقة)؛ مكتبة Recharts للتصور المتجاوب والمُنسق؛ دعم الوضع الداكن عبر كشف متغيرات CSS | TC-VIZ-001 إلى TC-VIZ-010 |
| ENT-15 | الجولة التوضيحية التفاعلية | Implemented | Demo Tour (`demo-tour.tsx`) | جولة إرشادية من 11 خطوة لبيئة العرض التوضيحي؛ تشغيل تلقائي بعد تسجيل الدخول التجريبي عبر علم sessionStorage؛ طبقة تسليط ضوئي مع أزرار Next/Back/Skip/Close؛ إعادة التشغيل عبر زر "Take a Tour" في شعار العرض التوضيحي الكهرماني؛ دعم متعدد اللغات بجميع لغات الاتحاد الأفريقي الخمس (EN/FR/PT/AR/SW) | TC-TOUR-001 إلى TC-TOUR-006 |

---

## 14. الملخص

| الفئة | إجمالي المتطلبات | مُنفذ | جزئي | غير مُنفذ |
|-------|-------------------|-------|------|-----------|
| FR-COL (جمع البيانات) | 8 | 8 | 0 | 0 |
| FR-CR (تقارير الائتمان) | 8 | 8 | 0 | 0 |
| FR-CON (الموافقة والنزاعات) | 9 | 9 | 0 | 0 |
| FR-REG (تنظيمي) | 3 | 3 | 0 | 0 |
| FR-SPEC (القروض الخاصة) | 5 | 5 | 0 | 0 |
| FR-COMM (تجاري) | 5 | 5 | 0 | 0 |
| FR-DP (مزودو البيانات) | 4 | 4 | 0 | 0 |
| INT-RPT (التكامل والتقارير) | 4 | 4 | 0 | 0 |
| DQ (جودة البيانات) | 5 | 5 | 0 | 0 |
| NFR-SEC (الأمان) | 10 | 10 | 0 | 0 |
| ENT (التحسينات المؤسسية) | 15 | 15 | 0 | 0 |
| **الإجمالي** | **79** | **79** | **0** | **0** |

---

## 14. التوقيع

| الدور | الاسم | التوقيع | التاريخ |
|-------|-------|---------|---------|
| مدير المشروع | | | |
| القائد التقني | | | |
| قائد ضمان الجودة | | | |
| ممثل العميل | | | |
