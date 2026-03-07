CREATE TABLE "dishonoured_cheques" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrower_id" varchar NOT NULL,
	"account_number" text NOT NULL,
	"cheque_number" text NOT NULL,
	"date_account_opened" text,
	"date_issued" text NOT NULL,
	"date_bounced" text NOT NULL,
	"reason_returned_code" text NOT NULL,
	"currency" text DEFAULT 'GHS' NOT NULL,
	"cheque_amount" numeric(15, 2) NOT NULL,
	"organization_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "voters_id" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "ssnit_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "drivers_license" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "ghana_card_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "proof_of_address_type" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "proof_of_address_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "mobile_money_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "ezwich_number" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "owner_or_tenant" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "employment_type_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "middle_names" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_name" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "alias" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "postal_address_1" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "postal_address_2" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "postal_address_3" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "postal_address_4" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_address_1" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_address_2" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_address_3" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_address_4" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "previous_addr_postal_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "date_moved_current_res" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "home_telephone" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "work_telephone" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "number_of_dependants" integer;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "income_currency" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "monthly_income" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "date_of_employment" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "employer_address" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "turnover_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "turnover_currency" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "sector_industry_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "sub_sector_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "business_type_code" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "registration_date" text;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN "commencement_date" text;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD COLUMN "court_location" text;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD COLUMN "court_type" text;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD COLUMN "case_filing_date" text;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD COLUMN "bog_case_type" text;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD COLUMN "case_reason" text;--> statement-breakpoint
ALTER TABLE "court_judgments" ADD COLUMN "judgment_currency" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "facility_type_code" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "purpose_of_facility" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "repayment_frequency" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "asset_classification" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amount_overdue" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "written_off_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "current_balance_indicator" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "arrears_start_date" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "disbursement_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "scheduled_installment_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "facility_term" integer;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "payment_history_profile" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "legal_flag" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_1_to_30" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_31_to_60" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_61_to_90" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_91_to_120" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_121_to_150" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_151_to_180" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "amt_overdue_181_plus" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "next_payment_date" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "closure_reason" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "date_restructured" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "reason_for_restructure" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "reason_for_written_off" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "credit_collateral_indicator" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "security_type" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "nature_of_charge" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "security_value" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "collateral_reg_ref_num" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "special_comments_code" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "nature_of_guarantor" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "bog_account_status" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "joint_or_sole_account" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "no_participants_in_account" integer;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "def_payment_start_date" text;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD COLUMN "bog_asset_classification" text;--> statement-breakpoint
ALTER TABLE "dishonoured_cheques" ADD CONSTRAINT "dishonoured_cheques_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishonoured_cheques" ADD CONSTRAINT "dishonoured_cheques_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;