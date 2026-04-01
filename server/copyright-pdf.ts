import PDFDocument from "pdfkit";

const TEAL = "#0d4a42";
const GOLD = "#c9952b";
const DARK = "#1a1a2e";
const GRAY = "#4a4a5a";
const LIGHT_GRAY = "#7a7a8a";
const RULE_COLOR = "#d4d4d8";
const ACCENT_BG = "#f8f9fa";

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

function drawPageBorder(doc: PDFKit.PDFDocument) {
  const m = 25;
  doc.save()
    .lineWidth(0.5)
    .strokeColor(TEAL)
    .rect(m, m, doc.page.width - m * 2, doc.page.height - m * 2)
    .stroke()
    .restore();

  doc.save()
    .lineWidth(0.3)
    .strokeColor(GOLD)
    .rect(m + 3, m + 3, doc.page.width - (m + 3) * 2, doc.page.height - (m + 3) * 2)
    .stroke()
    .restore();
}

function addHeader(doc: PDFKit.PDFDocument) {
  const pw = doc.page.width;
  const ml = doc.page.margins.left;
  const mr = doc.page.margins.right;
  const cw = pw - ml - mr;

  doc.save()
    .rect(ml, doc.y, cw, 3)
    .fill(TEAL)
    .restore();

  doc.y += 5;

  doc.save()
    .rect(ml, doc.y, cw, 1)
    .fill(GOLD)
    .restore();

  doc.y += 15;
}

function addFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  const pw = doc.page.width;
  const ml = doc.page.margins.left;
  const mr = doc.page.margins.right;
  const cw = pw - ml - mr;
  const footerY = doc.page.height - doc.page.margins.bottom + 10;

  doc.save()
    .rect(ml, footerY, cw, 0.5)
    .fill(RULE_COLOR)
    .restore();

  doc.save()
    .font("Helvetica")
    .fontSize(7)
    .fillColor(LIGHT_GRAY)
    .text("CONFIDENTIAL", ml, footerY + 5, { width: cw / 3, align: "left" })
    .text(`CDH v2.5 — Pan-African Credit Registry`, ml + cw / 3, footerY + 5, { width: cw / 3, align: "center" })
    .text(`Page ${pageNum} of ${totalPages}`, ml + (cw * 2 / 3), footerY + 5, { width: cw / 3, align: "right" })
    .restore();
}

function sectionTitle(doc: PDFKit.PDFDocument, num: string, title: string) {
  ensureSpace(doc, 50);
  const ml = doc.page.margins.left;
  const cw = doc.page.width - ml - doc.page.margins.right;

  doc.moveDown(0.8);

  doc.save()
    .rect(ml, doc.y, 4, 18)
    .fill(GOLD)
    .restore();

  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEAL)
    .text(`${num}. ${title}`, ml + 12, doc.y + 2, { width: cw - 12 });

  doc.moveDown(0.3);

  doc.save()
    .rect(ml, doc.y, cw, 0.5)
    .fill(RULE_COLOR)
    .restore();

  doc.moveDown(0.5);
}

function subSection(doc: PDFKit.PDFDocument, num: string, title: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(DARK)
    .text(`${num} ${title}`, doc.page.margins.left + 8);
  doc.moveDown(0.3);
}

function bodyText(doc: PDFKit.PDFDocument, text: string, indent = 0) {
  ensureSpace(doc, 20);
  const ml = doc.page.margins.left + indent;
  const cw = doc.page.width - ml - doc.page.margins.right;
  doc.font("Helvetica").fontSize(9.5).fillColor(GRAY)
    .text(text, ml, undefined, { width: cw, lineGap: 3, align: "justify" });
  doc.moveDown(0.3);
}

function bulletPoint(doc: PDFKit.PDFDocument, text: string, indent = 16) {
  ensureSpace(doc, 18);
  const ml = doc.page.margins.left + indent;
  const cw = doc.page.width - ml - doc.page.margins.right - 12;
  doc.font("Helvetica").fontSize(9.5).fillColor(GOLD)
    .text("●", ml, undefined, { continued: true });
  doc.fillColor(GRAY)
    .text(`  ${text}`, { width: cw, lineGap: 2.5 });
  doc.moveDown(0.15);
}

function numberedItem(doc: PDFKit.PDFDocument, num: string, text: string, indent = 16) {
  ensureSpace(doc, 18);
  const ml = doc.page.margins.left + indent;
  const cw = doc.page.width - ml - doc.page.margins.right - 12;
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEAL)
    .text(`${num}`, ml, undefined, { continued: true });
  doc.font("Helvetica").fillColor(GRAY)
    .text(`  ${text}`, { width: cw, lineGap: 2.5 });
  doc.moveDown(0.15);
}

function definitionItem(doc: PDFKit.PDFDocument, term: string, definition: string) {
  ensureSpace(doc, 25);
  const ml = doc.page.margins.left + 16;
  const cw = doc.page.width - ml - doc.page.margins.right;
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK)
    .text(`"${term}"`, ml, undefined, { continued: true });
  doc.font("Helvetica").fillColor(GRAY)
    .text(` — ${definition}`, { width: cw - 10, lineGap: 2.5 });
  doc.moveDown(0.15);
}

export function generateCopyrightPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 55, bottom: 55, left: 55, right: 55 },
      bufferPages: true,
      info: {
        Title: "Pan-African Credit Data Hub — Software Copyright & Intellectual Property Protection",
        Author: "Carlson Capital & Systems In Motion Limited",
        Subject: "Copyright and IP Protection Document",
        Keywords: "copyright, intellectual property, software, credit registry, pan-african, CDH",
        Creator: "CDH v2.5 Platform",
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pw = doc.page.width;
    const ml = doc.page.margins.left;
    const mr = doc.page.margins.right;
    const cw = pw - ml - mr;

    // ──── COVER PAGE ────
    doc.save()
      .rect(0, 0, pw, doc.page.height)
      .fill("#fafbfc")
      .restore();

    doc.save()
      .rect(0, 0, pw, 280)
      .fill(TEAL)
      .restore();

    doc.save()
      .rect(0, 275, pw, 6)
      .fill(GOLD)
      .restore();

    doc.save()
      .rect(ml - 10, 295, cw + 20, 0.5)
      .fillOpacity(0.15)
      .fill(TEAL)
      .restore();

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff").fillOpacity(0.6)
      .text("CARLSON CAPITAL & SYSTEMS IN MOTION LIMITED", ml, 60, { width: cw, align: "center" });

    doc.fillOpacity(1);

    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(28).fillColor("#ffffff")
      .text("SOFTWARE COPYRIGHT", ml, undefined, { width: cw, align: "center" });
    doc.font("Helvetica-Bold").fontSize(28).fillColor(GOLD)
      .text("& INTELLECTUAL PROPERTY", ml, undefined, { width: cw, align: "center" });
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#ffffff")
      .text("PROTECTION DOCUMENT", ml, undefined, { width: cw, align: "center" });

    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10).fillColor("#ffffff").fillOpacity(0.75)
      .text("Pan-African Credit Data Hub (CDH) v2.5", ml, undefined, { width: cw, align: "center" });

    doc.fillOpacity(1);

    doc.moveDown(4);

    const boxY = doc.y;
    doc.save()
      .roundedRect(ml + 30, boxY, cw - 60, 140, 6)
      .lineWidth(0.5)
      .strokeColor(RULE_COLOR)
      .fillAndStroke("#ffffff", RULE_COLOR)
      .restore();

    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEAL)
      .text("DOCUMENT REFERENCE", ml + 50, boxY + 18, { width: cw - 100 });
    doc.moveDown(0.5);

    const infoItems = [
      ["Document ID:", "CDH-IP-2026-001"],
      ["Version:", "2.5"],
      ["Classification:", "CONFIDENTIAL — PROPRIETARY"],
      ["Date of Issue:", new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
      ["Copyright Holder:", "Carlson Capital & Systems In Motion Limited"],
      ["Jurisdiction:", "Republic of Ghana & Pan-African Territories"],
    ];

    for (const [label, value] of infoItems) {
      doc.font("Helvetica").fontSize(8.5).fillColor(LIGHT_GRAY)
        .text(label, ml + 55, undefined, { continued: true, width: 120 });
      doc.font("Helvetica-Bold").fillColor(DARK)
        .text(value, { width: cw - 180 });
      doc.moveDown(0.05);
    }

    doc.y = doc.page.height - 100;
    doc.font("Helvetica").fontSize(7.5).fillColor(LIGHT_GRAY)
      .text("This document and all its contents are the exclusive intellectual property of Carlson Capital & Systems In Motion Limited.", ml, undefined, { width: cw, align: "center" })
      .text("Unauthorized reproduction, distribution, or use of this document or the software described herein is strictly prohibited.", ml, undefined, { width: cw, align: "center" });

    // ──── PAGE 2: TABLE OF CONTENTS ────
    doc.addPage();
    addHeader(doc);

    doc.font("Helvetica-Bold").fontSize(18).fillColor(TEAL)
      .text("Table of Contents", ml);
    doc.moveDown(0.5);
    doc.save().rect(ml, doc.y, 60, 2).fill(GOLD).restore();
    doc.moveDown(1);

    const toc = [
      ["1", "Preamble & Copyright Declaration"],
      ["2", "Definitions"],
      ["3", "Scope of Protected Works"],
      ["4", "Ownership & Authorship"],
      ["5", "Jurisdictional Coverage & Applicable Laws"],
      ["6", "Rights Reserved"],
      ["7", "Licensing Terms & Conditions"],
      ["8", "Trade Secret & Confidentiality Provisions"],
      ["9", "Database Rights & Data Protection"],
      ["10", "Enforcement & Remedies"],
      ["11", "International Treaties & Conventions"],
      ["12", "Term & Survival"],
      ["13", "Dispute Resolution"],
      ["14", "Notices & Contact Information"],
      ["15", "Schedules & Annexures"],
    ];

    for (const [num, title] of toc) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(TEAL)
        .text(num, ml + 10, undefined, { continued: true, width: 25 });
      doc.font("Helvetica").fillColor(GRAY)
        .text(title, { width: cw - 80 });
      doc.moveDown(0.15);
    }

    // ──── SECTION 1: PREAMBLE ────
    doc.addPage();
    addHeader(doc);

    sectionTitle(doc, "1", "Preamble & Copyright Declaration");

    bodyText(doc, "This document constitutes a formal declaration and assertion of copyright and intellectual property rights over the Pan-African Credit Data Hub (\"CDH\" or \"the Platform\"), version 2.5, a comprehensive software system developed by Carlson Capital & Systems In Motion Limited (\"the Company\", \"the Owner\", or \"the Copyright Holder\").");

    bodyText(doc, "The Platform is a sophisticated, multi-jurisdiction credit registry and risk assessment system designed and built to serve financial institutions, regulatory bodies, telecommunications companies, and government agencies across the African continent. It represents a significant investment of creative, technical, and financial resources.");

    bodyText(doc, "This declaration is made pursuant to applicable copyright legislation in the Republic of Ghana and in accordance with international copyright treaties and conventions to which Ghana and other African nations are signatories.");

    doc.moveDown(0.5);

    doc.save()
      .roundedRect(ml + 10, doc.y, cw - 20, 80, 4)
      .fill("#f0f7f5")
      .restore();

    const noticeY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEAL)
      .text("COPYRIGHT NOTICE", ml + 25, noticeY + 12, { width: cw - 50 });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK)
      .text("© 2024–2026 Carlson Capital & Systems In Motion Limited. All Rights Reserved.", ml + 25, undefined, { width: cw - 50 });
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
      .text("No part of this software, its source code, object code, documentation, user interfaces, algorithms, databases, data structures, or any derivative works may be reproduced, distributed, modified, reverse-engineered, decompiled, or transmitted in any form without the prior written consent of the Copyright Holder.", ml + 25, undefined, { width: cw - 50, lineGap: 2 });

    doc.y = noticeY + 88;

    // ──── SECTION 2: DEFINITIONS ────
    sectionTitle(doc, "2", "Definitions");

    bodyText(doc, "For the purposes of this document, the following terms shall have the meanings ascribed below:");
    doc.moveDown(0.2);

    definitionItem(doc, "The Platform", "The Pan-African Credit Data Hub (CDH) v2.5, including all software components, modules, APIs, user interfaces, databases, algorithms, documentation, and related materials.");
    definitionItem(doc, "Source Code", "The human-readable programming instructions, written in TypeScript, JavaScript, SQL, HTML, CSS, and any other programming languages, that constitute the Platform.");
    definitionItem(doc, "Object Code", "The compiled or interpreted form of the Source Code, including bundled assets, minified scripts, and deployable artifacts.");
    definitionItem(doc, "Algorithms", "The proprietary computational methods, including but not limited to credit scoring models, telco data analysis engines, risk assessment formulas, entity matching algorithms, and machine learning models embedded within the Platform.");
    definitionItem(doc, "Database Schema", "The structural design, table definitions, relationships, indexes, and data architecture of the Platform's PostgreSQL databases and any derivative storage systems.");
    definitionItem(doc, "User Interface", "All visual designs, layouts, component libraries, icons, typography selections, color schemes, animations, and interactive elements presented to end users.");
    definitionItem(doc, "Documentation", "All technical specifications, API documentation, user manuals, training materials, operational guides, and regulatory compliance documents.");
    definitionItem(doc, "Licensee", "Any individual, institution, organization, or government body authorized through a written license agreement to use the Platform.");
    definitionItem(doc, "Derivative Work", "Any modification, enhancement, adaptation, translation, localization, or configuration of the Platform or any of its components.");
    definitionItem(doc, "Confidential Information", "All non-public information about the Platform's architecture, algorithms, business logic, security mechanisms, and operational data.");

    // ──── SECTION 3: SCOPE ────
    sectionTitle(doc, "3", "Scope of Protected Works");

    bodyText(doc, "The copyright protection asserted herein covers, without limitation, the following components of the Platform:");

    subSection(doc, "3.1", "Core Software Components");
    bulletPoint(doc, "Multi-country credit bureau management system with jurisdiction-specific compliance engines");
    bulletPoint(doc, "Telco credit scoring engine utilizing mobile money transaction data, airtime patterns, and device metadata for unbanked population assessment");
    bulletPoint(doc, "Full telco lending lifecycle management including application processing, disbursement, repayment tracking, and collections");
    bulletPoint(doc, "Regulatory compliance dashboard covering 54 African jurisdictions with country-specific data retention policies");
    bulletPoint(doc, "AI-powered portfolio intelligence system with explainable credit scoring (300–850 scale)");
    bulletPoint(doc, "Blockchain audit anchoring system for tamper-evident audit trail verification");
    bulletPoint(doc, "Consumer self-service portal with credit score monitoring and dispute management");
    bulletPoint(doc, "Real-time entity matching engine for cross-border duplicate detection and resolution");
    bulletPoint(doc, "Role-based access control system with maker-checker workflow enforcement");

    subSection(doc, "3.2", "Proprietary Algorithms & Models");
    bulletPoint(doc, "NDIA (Number of Days in Arrears) tiered penalty scoring model with 5 classification tiers");
    bulletPoint(doc, "Amount in Arrears weighted penalty calculation engine");
    bulletPoint(doc, "Gradient boosting-inspired credit scoring model with reason code generation");
    bulletPoint(doc, "Telco behavioral scoring algorithms analyzing 14+ mobile usage dimensions");
    bulletPoint(doc, "Fuzzy entity matching algorithms utilizing Levenshtein distance, phonetic matching, and probabilistic record linkage");

    subSection(doc, "3.3", "User Interface Designs");
    bulletPoint(doc, "Dual visual style system (Pan-African and Scandinavian themes) with light/dark mode support");
    bulletPoint(doc, "Command center dashboard with country flag indicators and real-time KPI displays");
    bulletPoint(doc, "Credit report visualization with interactive score gauges and trend analysis");
    bulletPoint(doc, "Structured search interfaces for consumer and business credit inquiries");
    bulletPoint(doc, "IFF (Information Furnishing Format) batch upload interface with drag-and-drop file processing");

    subSection(doc, "3.4", "Database Architecture");
    bulletPoint(doc, "Complete PostgreSQL schema design including all tables, relationships, indexes, views, and stored procedures");
    bulletPoint(doc, "Multi-tenant data isolation architecture with organization-scoped access controls");
    bulletPoint(doc, "Audit trail logging system with comprehensive action tracking");
    bulletPoint(doc, "Data encryption framework for personally identifiable information (PII)");

    subSection(doc, "3.5", "Documentation & Training Materials");
    bulletPoint(doc, "API documentation and integration specifications");
    bulletPoint(doc, "Regulatory compliance guides for Ghana (BOG), Nigeria (CBN), Kenya (CBK), and other jurisdictions");
    bulletPoint(doc, "System architecture documents, deployment guides, and operational procedures");
    bulletPoint(doc, "User training materials and application guides");

    // ──── SECTION 4: OWNERSHIP ────
    sectionTitle(doc, "4", "Ownership & Authorship");

    bodyText(doc, "4.1  The Platform, in its entirety and in all its individual components, is the sole and exclusive intellectual property of Carlson Capital & Systems In Motion Limited, a company duly incorporated and registered in the Republic of Ghana.");

    bodyText(doc, "4.2  All rights, title, and interest in and to the Platform, including all copyrights, patent rights, trade secret rights, trademark rights, and all other intellectual property rights therein, are and shall remain the exclusive property of the Company.");

    bodyText(doc, "4.3  No transfer of ownership, whether in whole or in part, shall be implied or construed from any license agreement, service contract, deployment arrangement, or any other commercial engagement unless expressly stated in a separate, written agreement signed by authorized representatives of the Company.");

    bodyText(doc, "4.4  Any works created by employees, contractors, or consultants in the course of developing, maintaining, or enhancing the Platform are \"works made for hire\" and the copyright therein vests exclusively in the Company.");

    bodyText(doc, "4.5  Contributions, customizations, or configurations made by or for Licensees shall not create any ownership interest in the underlying Platform or its source code.");

    // ──── SECTION 5: JURISDICTIONAL COVERAGE ────
    sectionTitle(doc, "5", "Jurisdictional Coverage & Applicable Laws");

    bodyText(doc, "The copyright protection asserted herein is claimed under the laws of the following jurisdictions and international frameworks:");

    subSection(doc, "5.1", "Primary Jurisdiction — Republic of Ghana");
    bulletPoint(doc, "Copyright Act, 2005 (Act 690) — Provides protection for literary works (including computer programs), artistic works, and compilations/databases");
    bulletPoint(doc, "Electronic Transactions Act, 2008 (Act 772) — Governs electronic records, digital signatures, and data protection in electronic commerce");
    bulletPoint(doc, "Data Protection Act, 2012 (Act 843) — Protects personal data processed by the Platform");
    bulletPoint(doc, "National Communications Authority Act, 2008 (Act 769) — Relevant to telecommunications data processing");

    subSection(doc, "5.2", "Pan-African Coverage");
    bulletPoint(doc, "Nigeria: Copyright Act (Cap C28, LFN 2004) and the Nigerian Copyright Commission regulations");
    bulletPoint(doc, "Kenya: Copyright Act, 2001 (No. 12 of 2001) and the Kenya Copyright Board (KECOBO) framework");
    bulletPoint(doc, "South Africa: Copyright Act 98 of 1978, as amended, and the Electronic Communications and Transactions Act 25 of 2002");
    bulletPoint(doc, "Rwanda: Law No. 31/2009 on the Protection of Intellectual Property and its implementing regulations");
    bulletPoint(doc, "Tanzania: Copyright and Neighbouring Rights Act No. 7 of 1999");
    bulletPoint(doc, "Uganda: Copyright and Neighbouring Rights Act, Cap. 222 and the Copyright Regulations, 2010");
    bulletPoint(doc, "Ethiopia: Proclamation No. 410/2004 — Copyright and Neighbouring Rights Protection");
    bulletPoint(doc, "Sierra Leone: Copyright Act 2011");
    bulletPoint(doc, "Liberia: Intellectual Property Act of 2016, Title 24");

    subSection(doc, "5.3", "Regional & Continental Frameworks");
    bulletPoint(doc, "African Regional Intellectual Property Organization (ARIPO) — Banjul Protocol on Marks and Harare Protocol on Patents");
    bulletPoint(doc, "Organisation Africaine de la Propriété Intellectuelle (OAPI) — Bangui Agreement (Revised 1999)");
    bulletPoint(doc, "African Continental Free Trade Area (AfCFTA) — Protocol on Intellectual Property Rights");
    bulletPoint(doc, "African Union — African Charter on Human and Peoples' Rights (Article 14, protection of property)");

    // ──── SECTION 6: RIGHTS RESERVED ────
    sectionTitle(doc, "6", "Rights Reserved");

    bodyText(doc, "The Company expressly reserves all rights not specifically granted in any license agreement, including but not limited to:");

    numberedItem(doc, "(a)", "The right to reproduce the Platform in whole or in part, in any medium now known or hereafter developed.");
    numberedItem(doc, "(b)", "The right to create derivative works based upon the Platform or any of its components.");
    numberedItem(doc, "(c)", "The right to distribute copies of the Platform by any means, including sale, rental, lease, or lending.");
    numberedItem(doc, "(d)", "The right to publicly display or perform any user interface, visualization, or output generated by the Platform.");
    numberedItem(doc, "(e)", "The right to sublicense any or all of the foregoing rights to third parties.");
    numberedItem(doc, "(f)", "The right to modify, enhance, update, or discontinue the Platform or any of its features at any time.");
    numberedItem(doc, "(g)", "The right to control the means, methods, and formats of deployment and distribution.");

    // ──── SECTION 7: LICENSING ────
    sectionTitle(doc, "7", "Licensing Terms & Conditions");

    subSection(doc, "7.1", "General Licensing Principles");
    bodyText(doc, "Access to and use of the Platform is granted exclusively through written license agreements executed between the Company and each Licensee. No license is implied by possession, access, demonstration, or evaluation of the Platform.");

    subSection(doc, "7.2", "License Categories");
    bulletPoint(doc, "Institutional License: Grants a named financial institution, credit bureau, or regulatory body the right to access and use the Platform for internal credit operations within specified jurisdictions.");
    bulletPoint(doc, "Government License: Grants a government body or central bank the right to use the Platform for regulatory oversight, supervision, and policy analysis within their jurisdiction.");
    bulletPoint(doc, "Telco Partner License: Grants a telecommunications company the right to integrate with the Platform's telco scoring and lending APIs for credit assessment of their subscriber base.");
    bulletPoint(doc, "API Integration License: Grants a third-party system the right to connect to the Platform's REST APIs for data submission, credit report generation, or score retrieval.");

    subSection(doc, "7.3", "License Restrictions");
    bodyText(doc, "Unless expressly authorized in writing, no Licensee may:");
    numberedItem(doc, "(i)", "Copy, reproduce, or duplicate the Platform's source code, object code, or any component thereof.");
    numberedItem(doc, "(ii)", "Reverse-engineer, decompile, disassemble, or attempt to derive the source code of any portion of the Platform.");
    numberedItem(doc, "(iii)", "Modify, adapt, translate, or create derivative works from the Platform without written authorization.");
    numberedItem(doc, "(iv)", "Sublicense, rent, lease, lend, or transfer access to the Platform to any third party.");
    numberedItem(doc, "(v)", "Remove, alter, or obscure any copyright notices, trademarks, or proprietary legends on or in the Platform.");
    numberedItem(doc, "(vi)", "Use the Platform to develop a competing product or service.");
    numberedItem(doc, "(vii)", "Disclose any Confidential Information about the Platform's architecture, algorithms, or security mechanisms.");

    // ──── SECTION 8: TRADE SECRETS ────
    sectionTitle(doc, "8", "Trade Secret & Confidentiality Provisions");

    bodyText(doc, "8.1  The Company asserts trade secret protection over the following aspects of the Platform, which derive independent economic value from not being generally known:");

    bulletPoint(doc, "Credit scoring algorithms, weighting factors, and model parameters");
    bulletPoint(doc, "Telco behavioral scoring dimensions and threshold configurations");
    bulletPoint(doc, "Entity matching probability models and resolution logic");
    bulletPoint(doc, "Security architecture, encryption schemes, and access control mechanisms");
    bulletPoint(doc, "Database optimization strategies, indexing patterns, and query architectures");
    bulletPoint(doc, "Business rules, regulatory compliance logic, and jurisdiction-specific configurations");

    bodyText(doc, "8.2  All persons and entities who obtain access to any trade secrets of the Company are bound by obligations of confidentiality, whether by virtue of a license agreement, employment contract, non-disclosure agreement, or by operation of law.");

    bodyText(doc, "8.3  The Company maintains reasonable measures to protect the secrecy of its trade secrets, including but not limited to: role-based access controls, code repository access restrictions, encrypted communications, employment agreements with confidentiality clauses, and physical and logical security measures at all development and deployment facilities.");

    // ──── SECTION 9: DATABASE RIGHTS ────
    sectionTitle(doc, "9", "Database Rights & Data Protection");

    bodyText(doc, "9.1  The structural design, schema architecture, and organization of all databases within the Platform constitute original compilations protected by copyright. The selection, arrangement, and coordination of data fields, relationships, and indexes reflect substantial creative judgment.");

    bodyText(doc, "9.2  The Company asserts sui generis database rights over any database populated through the substantial investment of resources in the obtaining, verification, or presentation of data within the Platform.");

    bodyText(doc, "9.3  Licensees who process personal data through the Platform remain data controllers under applicable data protection laws. The Company acts as a data processor and maintains appropriate technical and organizational measures in accordance with:");
    bulletPoint(doc, "Ghana Data Protection Act, 2012 (Act 843)");
    bulletPoint(doc, "Nigeria Data Protection Regulation (NDPR) 2019 and Nigeria Data Protection Act 2023");
    bulletPoint(doc, "Kenya Data Protection Act, 2019");
    bulletPoint(doc, "South Africa Protection of Personal Information Act 4 of 2013 (POPIA)");
    bulletPoint(doc, "Rwanda Law No. 058/2021 Relating to the Protection of Personal Data and Privacy");
    bulletPoint(doc, "African Union Convention on Cyber Security and Personal Data Protection (Malabo Convention)");

    // ──── SECTION 10: ENFORCEMENT ────
    sectionTitle(doc, "10", "Enforcement & Remedies");

    bodyText(doc, "10.1  The Company shall vigorously enforce its intellectual property rights against any unauthorized use, reproduction, distribution, or exploitation of the Platform. Available remedies include, but are not limited to:");

    numberedItem(doc, "(a)", "Injunctive Relief: Seeking court orders to immediately halt any infringing activity, including emergency ex-parte applications where warranted.");
    numberedItem(doc, "(b)", "Damages: Claiming compensatory damages for actual losses suffered, including lost revenue, lost licensing opportunities, and reputational harm.");
    numberedItem(doc, "(c)", "Account of Profits: Requiring infringers to disgorge all profits derived from the unauthorized use of the Platform.");
    numberedItem(doc, "(d)", "Statutory Damages: Where available under applicable copyright legislation, claiming statutory or punitive damages.");
    numberedItem(doc, "(e)", "Criminal Prosecution: Referring willful infringement to appropriate law enforcement authorities for criminal prosecution under applicable copyright laws.");
    numberedItem(doc, "(f)", "Administrative Action: Filing complaints with intellectual property offices, copyright commissions, and regulatory authorities.");
    numberedItem(doc, "(g)", "Technical Measures: Deploying license verification mechanisms, remote access revocation, and digital rights management technologies.");

    bodyText(doc, "10.2  The Company maintains the right to conduct audits of Licensees' use of the Platform to verify compliance with license terms, upon reasonable notice.");

    // ──── SECTION 11: INTERNATIONAL TREATIES ────
    sectionTitle(doc, "11", "International Treaties & Conventions");

    bodyText(doc, "The Company claims protection under the following international copyright treaties and conventions, to the extent that each is applicable in the relevant jurisdiction:");

    bulletPoint(doc, "Berne Convention for the Protection of Literary and Artistic Works (1886, as revised) — Automatic copyright protection across all 181 member states without registration formality.");
    bulletPoint(doc, "WIPO Copyright Treaty (WCT) 1996 — Extended protection for computer programs and compilations of data.");
    bulletPoint(doc, "Agreement on Trade-Related Aspects of Intellectual Property Rights (TRIPS) — Minimum standards of IP protection applicable through WTO membership.");
    bulletPoint(doc, "Universal Copyright Convention (UCC) — Supplementary international protection framework.");
    bulletPoint(doc, "WIPO Performances and Phonograms Treaty (WPPT) — Protection for digital content and performances embedded in the Platform.");

    // ──── SECTION 12: TERM ────
    sectionTitle(doc, "12", "Term & Survival");

    bodyText(doc, "12.1  Copyright protection in the Platform subsists for the duration provided by the copyright laws of each applicable jurisdiction. Under Ghana's Copyright Act, 2005, copyright in a work made by a body corporate endures for seventy (70) years from the date of first publication.");

    bodyText(doc, "12.2  Trade secret protection shall continue indefinitely, for so long as the information retains its character as a trade secret — that is, for so long as it remains confidential and continues to derive economic value from its secrecy.");

    bodyText(doc, "12.3  The obligations of confidentiality, non-disclosure, and non-use imposed upon Licensees, employees, contractors, and third parties shall survive the expiration or termination of any license agreement, employment contract, or other arrangement.");

    bodyText(doc, "12.4  The first publication date of the Platform is established as January 2024, with continuous development and enhancement through the current version (v2.5, 2026).");

    // ──── SECTION 13: DISPUTE RESOLUTION ────
    sectionTitle(doc, "13", "Dispute Resolution");

    bodyText(doc, "13.1  Any dispute arising out of or in connection with the intellectual property rights asserted in this document shall be resolved in accordance with the following procedure:");

    numberedItem(doc, "(a)", "Negotiation: The parties shall first attempt to resolve the dispute through good-faith negotiation within thirty (30) days of written notice of the dispute.");
    numberedItem(doc, "(b)", "Mediation: If negotiation fails, the parties shall submit the dispute to mediation under the Ghana Alternative Dispute Resolution Act, 2010 (Act 798), or an equivalent mediation framework in the relevant jurisdiction.");
    numberedItem(doc, "(c)", "Arbitration: If mediation fails, the dispute shall be submitted to binding arbitration administered by the Ghana Arbitration Centre, or alternatively by the Kigali International Arbitration Centre (KIAC) for disputes arising in East Africa.");
    numberedItem(doc, "(d)", "Litigation: The Company reserves the right to seek injunctive relief or other urgent remedies from any court of competent jurisdiction at any time, regardless of the status of arbitration proceedings.");

    bodyText(doc, "13.2  The governing law for this document and all related disputes shall be the laws of the Republic of Ghana, without regard to conflict of law principles.");

    // ──── SECTION 14: NOTICES ────
    sectionTitle(doc, "14", "Notices & Contact Information");

    bodyText(doc, "All notices, requests, and communications relating to the intellectual property rights described herein shall be directed to:");

    doc.moveDown(0.3);

    doc.save()
      .roundedRect(ml + 20, doc.y, cw - 40, 105, 4)
      .fillAndStroke("#f8f9fa", RULE_COLOR)
      .restore();

    const contactY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEAL)
      .text("Carlson Capital & Systems In Motion Limited", ml + 35, contactY + 12, { width: cw - 70 });
    doc.font("Helvetica").fontSize(9).fillColor(GRAY)
      .text("Intellectual Property Department", ml + 35, undefined, { width: cw - 70 })
      .text("Accra, Republic of Ghana", ml + 35, undefined, { width: cw - 70 })
      .text("", ml + 35, undefined, { width: cw - 70 })
      .text("For licensing inquiries, copyright matters, or infringement reports,", ml + 35, undefined, { width: cw - 70 })
      .text("please contact the Company through official channels.", ml + 35, undefined, { width: cw - 70 });

    doc.y = contactY + 115;

    // ──── SECTION 15: SCHEDULES ────
    sectionTitle(doc, "15", "Schedules & Annexures");

    subSection(doc, "15.1", "Schedule A — Protected Software Modules");
    const modules = [
      "Credit Scoring Engine (server/credit-score.ts)",
      "Telco Lending Lifecycle Manager",
      "Entity Matching & Resolution Engine",
      "Regulatory Compliance Dashboard",
      "Blockchain Audit Anchoring System",
      "Multi-Currency Exchange Rate Service",
      "BOG/CBN/CBK Compliance Modules",
      "IFF Data Processing Pipeline",
      "Consumer Self-Service Portal",
      "Institutional Management & Billing System",
      "API Gateway & External Integration Layer",
      "Real-Time WebSocket Communication System",
      "Consent Management Framework",
      "Data Retention & Archival Engine",
      "Dispute Management Workflow System",
      "Structured Search (Consumer & Business)",
      "PDF Report Generation System",
      "Batch Upload Processing Engine (CSV, JSON, XBRL, IFF)",
    ];
    for (const mod of modules) {
      bulletPoint(doc, mod);
    }

    subSection(doc, "15.2", "Schedule B — Supported Jurisdictions");
    const countries = [
      "Ghana (GH) — Bank of Ghana (BOG)",
      "Nigeria (NG) — Central Bank of Nigeria (CBN)",
      "Kenya (KE) — Central Bank of Kenya (CBK)",
      "South Africa (ZA) — South African Reserve Bank (SARB)",
      "Rwanda (RW) — National Bank of Rwanda (BNR)",
      "Tanzania (TZ) — Bank of Tanzania (BOT)",
      "Uganda (UG) — Bank of Uganda (BOU)",
      "Ethiopia (ET) — National Bank of Ethiopia (NBE)",
      "Sierra Leone (SL) — Bank of Sierra Leone (BSL)",
      "Liberia (LR) — Central Bank of Liberia (CBL)",
    ];
    for (const country of countries) {
      bulletPoint(doc, country);
    }

    subSection(doc, "15.3", "Schedule C — Registration & Filing Records");
    bodyText(doc, "The Company maintains records of copyright registration filings, deposit copies, and related documentation. Registration references will be appended to this document upon completion of formal registration with the Copyright Office of Ghana and other applicable authorities.");

    // ──── SIGNATURE PAGE ────
    doc.addPage();
    addHeader(doc);

    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(TEAL)
      .text("Execution & Authentication", ml, undefined, { width: cw, align: "center" });
    doc.moveDown(0.3);
    doc.save().rect(ml + (cw / 2) - 30, doc.y, 60, 2).fill(GOLD).restore();
    doc.moveDown(2);

    bodyText(doc, "This Software Copyright and Intellectual Property Protection Document has been duly authorized, executed, and issued by the undersigned authorized representative(s) of Carlson Capital & Systems In Motion Limited.");
    doc.moveDown(1.5);

    const sigBoxes = [
      { title: "For and on behalf of:", company: "Carlson Capital & Systems In Motion Limited" },
      { title: "Witness:", company: "" },
    ];

    for (const sigBox of sigBoxes) {
      ensureSpace(doc, 120);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK)
        .text(sigBox.title, ml + 20);
      if (sigBox.company) {
        doc.font("Helvetica").fontSize(9).fillColor(GRAY)
          .text(sigBox.company, ml + 20);
      }
      doc.moveDown(2);

      doc.save()
        .moveTo(ml + 20, doc.y)
        .lineTo(ml + 250, doc.y)
        .lineWidth(0.5)
        .strokeColor(RULE_COLOR)
        .stroke()
        .restore();
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
        .text("Signature", ml + 20);
      doc.moveDown(1);

      doc.save()
        .moveTo(ml + 20, doc.y)
        .lineTo(ml + 250, doc.y)
        .lineWidth(0.5)
        .strokeColor(RULE_COLOR)
        .stroke()
        .restore();
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
        .text("Name & Title", ml + 20);
      doc.moveDown(1);

      doc.save()
        .moveTo(ml + 20, doc.y)
        .lineTo(ml + 250, doc.y)
        .lineWidth(0.5)
        .strokeColor(RULE_COLOR)
        .stroke()
        .restore();
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY)
        .text("Date", ml + 20);
      doc.moveDown(1.5);
    }

    doc.moveDown(1);

    doc.save()
      .roundedRect(ml + 15, doc.y, cw - 30, 45, 4)
      .fill("#f8f9fa")
      .restore();

    const sealY = doc.y;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
      .text("CORPORATE SEAL / STAMP", ml + 30, sealY + 8, { width: cw - 60 });
    doc.font("Helvetica").fontSize(7.5).fillColor(LIGHT_GRAY)
      .text("Affix company seal or official stamp here", ml + 30, undefined, { width: cw - 60 });

    // ──── PAGE DECORATIONS ────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      drawPageBorder(doc);
      if (i > 0) {
        addFooter(doc, i, pages.count - 1);
      }
    }

    doc.end();
  });
}
