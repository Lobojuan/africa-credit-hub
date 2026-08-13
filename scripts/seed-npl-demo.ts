/**
 * Standalone script to pre-populate NPL demo data on the pilot database.
 * Run with: DATABASE_URL=<pilot-url> npx tsx scripts/seed-npl-demo.ts
 */

import { pool } from "../server/db";
import { runNplClassification, generatePortfolioSummary } from "../server/npl-classification-engine";

async function main() {
  console.log("🚀 Seeding NPL demo data for bank pilot...");

  // Step 1: Run classification on all Ghana accounts
  console.log("Running NPL classification...");
  const result = await runNplClassification({ country: "Ghana", autoTriggerCollection: false });
  console.log("Classification result:", result);

  // Step 2: Generate portfolio summary for today
  const today = new Date().toISOString().slice(0, 10);
  console.log(`Generating portfolio summary for ${today}...`);
  const summary = await generatePortfolioSummary(today, "Ghana");
  console.log("Summary generated:", summary);

  // Step 3: Verify data
  const { rows: classifications } = await pool.query(`
    SELECT c.npl_stage, c.ifrs9_stage, c.provision_amount, a.account_number, a.days_in_arrears
    FROM credit_account_classifications c
    JOIN credit_accounts a ON a.id = c.credit_account_id
    ORDER BY a.days_in_arrears DESC
  `);
  console.log("\n📊 Classifications:");
  console.table(classifications);

  const { rows: summaries } = await pool.query(`
    SELECT * FROM npl_portfolio_summaries WHERE summary_date = $1
  `, [today]);
  console.log("\n📈 Portfolio Summary:");
  console.table(summaries);

  console.log("\n✅ NPL demo data ready for bank pilot!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed to seed NPL demo data:", err);
  process.exit(1);
});
