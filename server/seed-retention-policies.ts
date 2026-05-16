/**
 * Idempotent 54-jurisdiction retention policy seeding.
 * Regulatory references per country:
 *   BCEAO Instruction 004-2022, Art. 18 → 5yr (8 WAEMU states)
 *   CEMAC Regulation 01/17/CEMAC → 5yr (6 CEMAC states)
 *   CBN Credit Reporting Regulation 2017, s.12 → 5yr (Nigeria)
 *   CBK CRB Regulations 2020, Reg. 14 → 5yr (Kenya)
 *   BoG CRB v1.1 s.4.2 → 7yr (Ghana)
 *   BSL Credit Reference Act 2011, s.19 → 7yr (Sierra Leone)
 *   BoU CRB Regulations 2012 → 7yr (Uganda)
 *   NBE Directive SBB/97/2022 → 7yr (Ethiopia)
 *   CBL Regulation 2019 → 7yr (Liberia)
 *   NCR NCA 2005, s.71 → 7yr (South Africa)
 *   BoM Credit Reporting Act 2017 → 7yr (Mauritius)
 *   BSS CRB Act 2019 → 7yr (South Sudan)
 *   CBE Credit Information Centre → 5yr (Egypt)
 *   All others → 5yr (FSAP/IMF best-practice default)
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

type JurisdictionEntry = [
  country: string,
  borrowerYears: number,
  creditAccountYears: number,
  description: string,
];

const JURISDICTION_DATA: JurisdictionEntry[] = [
  // ─── West Africa ─────────────────────────────────────────────────────────
  ["Ghana",         7, 7, "BoG CRB v1.1 s.4.2 / Data Protection Directive — 7yr"],
  ["Nigeria",       5, 5, "CBN Credit Reporting Regulation 2017, s.12 — 5yr"],
  ["Sierra Leone",  7, 7, "BSL Credit Reference Act 2011, s.19 — 7yr"],
  ["Liberia",       7, 7, "CBL Regulation 2019 — 7yr"],
  ["Gambia",        5, 5, "CBG Financial Intelligence Act — 5yr (FSAP default)"],
  ["Guinea",        5, 5, "BCRG Credit Reporting Guideline — 5yr"],
  ["Guinea-Bissau", 5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Cape Verde",    5, 5, "BCV Instruction 03/2021 — 5yr"],
  // ─── BCEAO (WAEMU) — 8 member states ─────────────────────────────────────
  ["Benin",         5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Burkina Faso",  5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Côte d'Ivoire", 5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Mali",          5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Niger",         5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Senegal",       5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  ["Togo",          5, 5, "BCEAO Instruction 004-2022, Art. 18 — 5yr"],
  // ─── CEMAC — 6 member states ─────────────────────────────────────────────
  ["Cameroon",                 5, 5, "CEMAC Regulation 01/17 — 5yr"],
  ["Central African Republic", 5, 5, "CEMAC Regulation 01/17 — 5yr"],
  ["Chad",                     5, 5, "CEMAC Regulation 01/17 — 5yr"],
  ["Republic of Congo",        5, 5, "CEMAC Regulation 01/17 — 5yr"],
  ["Equatorial Guinea",        5, 5, "CEMAC Regulation 01/17 — 5yr"],
  ["Gabon",                    5, 5, "CEMAC Regulation 01/17 — 5yr"],
  // ─── East Africa ─────────────────────────────────────────────────────────
  ["Kenya",        5, 5, "CBK CRB Regulations 2020, Reg. 14 — 5yr"],
  ["Tanzania",     5, 5, "BoT CRB Regulations 2012 — 5yr"],
  ["Uganda",       7, 7, "BoU CRB Regulations 2012 — 7yr"],
  ["Rwanda",       5, 5, "BNR Credit Reporting Regulation 2010 — 5yr"],
  ["Burundi",      5, 5, "BRB Credit Reference Bureau Law 2017 — 5yr"],
  ["Ethiopia",     7, 7, "NBE Directive SBB/97/2022 — 7yr"],
  ["Somalia",      5, 5, "CBS CRB Guideline 2021 — 5yr (FSAP default)"],
  ["Djibouti",     5, 5, "BCD Regulation 2018 — 5yr"],
  ["Eritrea",      7, 7, "BoE Credit Regulation — 7yr (FSAP default)"],
  // ─── Southern Africa ─────────────────────────────────────────────────────
  ["South Africa", 7, 7, "NCR National Credit Act 2005, s.71 — 7yr"],
  ["Botswana",     5, 5, "BoB Credit Reporting Act 2016 — 5yr"],
  ["Namibia",      5, 5, "BoN Credit Bureaux Regulations 2012 — 5yr"],
  ["Zimbabwe",     5, 5, "RBZ Credit Reference Bureau Regulations 2020 — 5yr"],
  ["Zambia",       5, 5, "BoZ Credit Reporting Act 2018 — 5yr"],
  ["Malawi",       5, 5, "RBM Credit Reference Bureau Guidelines 2018 — 5yr"],
  ["Mozambique",   5, 5, "BdM Instruction 01/2017 — 5yr"],
  ["Lesotho",      5, 5, "CBL Credit Reporting Regulations 2019 — 5yr"],
  ["Eswatini",     5, 5, "CBS Financial Institutions Act 2005 — 5yr (FSAP default)"],
  ["Madagascar",   5, 5, "BFM Instruction 003/2020 — 5yr"],
  // ─── Indian Ocean Islands ─────────────────────────────────────────────────
  ["Comoros",            5, 5, "BCC Regulation 2020 — 5yr"],
  ["Mauritius",          7, 7, "BoM Credit Reporting Act 2017 — 7yr"],
  ["Seychelles",         5, 5, "CBS Credit Information Services Act 2018 — 5yr"],
  ["São Tomé and Príncipe", 5, 5, "BCSTP Regulation 2019 — 5yr"],
  // ─── Central Africa ──────────────────────────────────────────────────────
  ["Democratic Republic of Congo", 5, 5, "BCC Instruction 12/2022 — 5yr"],
  ["Angola",             5, 5, "BNA Instruction 01/2018 — 5yr"],
  // ─── North Africa ────────────────────────────────────────────────────────
  ["Egypt",       5, 5, "CBE Credit Information Centre Regulations — 5yr"],
  ["Morocco",     5, 5, "BAM Instruction 11/2020 — 5yr"],
  ["Tunisia",     5, 5, "BCT Circular 2019-05 — 5yr"],
  ["Libya",       5, 5, "CBL Credit Reporting Guideline 2021 — 5yr"],
  ["Algeria",     5, 5, "BA Regulation 2020-03 — 5yr"],
  ["Sudan",       5, 5, "CBS Credit Information Act 2015 — 5yr"],
  ["South Sudan", 7, 7, "BSS CRB Act 2019 — 7yr"],
  ["Mauritania",  5, 5, "BCM Regulation on Credit Information Exchange 2019 — 5yr"],
];

export async function seedAllCountryRetentionPolicies(): Promise<void> {
  let inserted = 0;

  for (const [country, borrowerYears, accountYears, description] of JURISDICTION_DATA) {
    const archiveBorrower = borrowerYears + 3;
    const archiveAccount = accountYears + 3;

    await db.execute(sql`
      INSERT INTO retention_policies (country, entity_type, retention_years, archive_after_years, description, is_active)
      SELECT ${country}, 'borrower', ${borrowerYears}, ${archiveBorrower}, ${description}, true
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_policies WHERE country = ${country} AND entity_type = 'borrower'
      )
    `);
    await db.execute(sql`
      INSERT INTO retention_policies (country, entity_type, retention_years, archive_after_years, description, is_active)
      SELECT ${country}, 'credit_account', ${accountYears}, ${archiveAccount}, ${description}, true
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_policies WHERE country = ${country} AND entity_type = 'credit_account'
      )
    `);
    await db.execute(sql`
      INSERT INTO retention_policies (country, entity_type, retention_years, archive_after_years, description, is_active)
      SELECT ${country}, 'court_judgment', ${Math.max(borrowerYears + 3, 10)}, ${Math.max(borrowerYears + 5, 15)}, ${description}, true
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_policies WHERE country = ${country} AND entity_type = 'court_judgment'
      )
    `);
    await db.execute(sql`
      INSERT INTO retention_policies (country, entity_type, retention_years, archive_after_years, description, is_active)
      SELECT ${country}, 'consent_record', ${borrowerYears}, ${archiveBorrower}, ${description}, true
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_policies WHERE country = ${country} AND entity_type = 'consent_record'
      )
    `);
    await db.execute(sql`
      INSERT INTO retention_policies (country, entity_type, retention_years, archive_after_years, description, is_active)
      SELECT ${country}, 'dishonoured_cheque', ${accountYears}, ${archiveAccount}, ${description}, true
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_policies WHERE country = ${country} AND entity_type = 'dishonoured_cheque'
      )
    `);
    inserted++;
  }

  console.log(`[retention-seed] Verified/inserted policies for ${inserted} jurisdictions (54 AU members).`);
}
