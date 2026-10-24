CREATE TYPE "public"."user_role" AS ENUM('customer', 'seller', 'staff', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'pending_approval', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('stock_in', 'reservation_placed', 'reservation_released', 'reservation_fulfilled', 'adjustment', 'return_restock');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('requires_payment', 'processing', 'captured', 'partially_refunded', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sub_order_status" AS ENUM('payment_pending', 'processing', 'manifested', 'shipped', 'customs_cleared', 'out_for_delivery', 'delivered', 'disputed', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "public"."journal_reference_type" AS ENUM('order_payment', 'escrow_release', 'refund', 'chargeback', 'fee_deduction', 'reserve_release');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('scheduled', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"phone_number" varchar(30),
	"preferred_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"preferred_language" varchar(5) DEFAULT 'en' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"target_currency" varchar(3) NOT NULL,
	"market_rate" numeric(14, 6) NOT NULL,
	"buffer_percentage" numeric(5, 2) DEFAULT '1.50' NOT NULL,
	"effective_rate" numeric(14, 6) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"default_currency" varchar(3) NOT NULL,
	"tax_engine" varchar(50) DEFAULT 'stripe_tax' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"legal_entity_type" varchar(50) NOT NULL,
	"tax_id_number" varchar(100) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"stripe_connected_account_id" varchar(255),
	"wise_recipient_id" varchar(255),
	"commission_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"rolling_reserve_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"rolling_reserve_days" integer DEFAULT 60 NOT NULL,
	"escrow_inspection_days" integer DEFAULT 14 NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"kyc_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payout_bank_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"warehouse_name" varchar(100) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"state_province" varchar(100),
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"phone_contact" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"slug" varchar(120) NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"hs_code_default" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"title_i18n" jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"weight_grams" numeric(10, 2) NOT NULL,
	"length_cm" numeric(10, 2) NOT NULL,
	"width_cm" numeric(10, 2) NOT NULL,
	"height_cm" numeric(10, 2) NOT NULL,
	"base_price_usd" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title_i18n" jsonb NOT NULL,
	"description_i18n" jsonb NOT NULL,
	"brand" varchar(100),
	"hs_code" varchar(20) NOT NULL,
	"origin_country" varchar(2) NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"available_stock" integer DEFAULT 0 NOT NULL,
	"reserved_stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_positive_available_stock" CHECK ("inventory_levels"."available_stock" >= 0),
	CONSTRAINT "chk_positive_reserved_stock" CHECK ("inventory_levels"."reserved_stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"movement_type" "inventory_movement_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"reference_order_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"customer_id" uuid NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate_applied" numeric(14, 6) NOT NULL,
	"payment_intent_id" varchar(255),
	"payment_status" "payment_status" DEFAULT 'requires_payment' NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "parent_orders_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "sub_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"product_title_snapshot" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_usd" numeric(12, 2) NOT NULL,
	"unit_price_paid" numeric(12, 2) NOT NULL,
	"total_line_amount" numeric(12, 2) NOT NULL,
	"hs_code" varchar(20) NOT NULL,
	"duty_rate_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"tax_rate_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"duty_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_item_quantity" CHECK ("sub_order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "sub_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_order_number" varchar(35) NOT NULL,
	"parent_order_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"items_subtotal" numeric(12, 2) NOT NULL,
	"shipping_cost" numeric(12, 2) NOT NULL,
	"customs_duties_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"vat_gst_tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"carrier_name" varchar(50),
	"carrier_tracking_code" varchar(255),
	"carrier_label_url" varchar(1000),
	"commercial_invoice_url" varchar(1000),
	"order_status" "sub_order_status" DEFAULT 'payment_pending' NOT NULL,
	"inspection_expires_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sub_orders_sub_order_number_unique" UNIQUE("sub_order_number")
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "account_type" NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "ledger_journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" varchar(40) NOT NULL,
	"reference_type" "journal_reference_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"description" text NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_journal_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "ledger_journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"seller_id" uuid,
	"debit_amount" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
	"credit_amount" numeric(14, 4) DEFAULT '0.0000' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_positive_debit" CHECK ("ledger_journal_lines"."debit_amount" >= 0),
	CONSTRAINT "chk_positive_credit" CHECK ("ledger_journal_lines"."credit_amount" >= 0),
	CONSTRAINT "chk_debit_xor_credit" CHECK (("ledger_journal_lines"."debit_amount" > 0 AND "ledger_journal_lines"."credit_amount" = 0) OR ("ledger_journal_lines"."credit_amount" > 0 AND "ledger_journal_lines"."debit_amount" = 0))
);
--> statement-breakpoint
CREATE TABLE "seller_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_batch_id" varchar(50),
	"seller_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_transaction_id" varchar(255),
	"status" "payout_status" DEFAULT 'scheduled' NOT NULL,
	"failure_reason" text,
	"scheduled_for" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_order_id" uuid NOT NULL,
	"carrier" varchar(50) NOT NULL,
	"tracking_number" varchar(100) NOT NULL,
	"label_format" varchar(10) DEFAULT 'PDF' NOT NULL,
	"label_url" text NOT NULL,
	"commercial_invoice_url" text NOT NULL,
	"weight_kg" numeric(8, 3) NOT NULL,
	"customs_declaration" jsonb NOT NULL,
	"current_status" varchar(50) DEFAULT 'manifested' NOT NULL,
	"shipped_at" timestamp with time zone,
	"estimated_delivery" timestamp with time zone,
	"actual_delivery" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(50) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_orders" ADD CONSTRAINT "parent_orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_order_items" ADD CONSTRAINT "sub_order_items_sub_order_id_sub_orders_id_fk" FOREIGN KEY ("sub_order_id") REFERENCES "public"."sub_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_order_items" ADD CONSTRAINT "sub_order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_parent_order_id_parent_orders_id_fk" FOREIGN KEY ("parent_order_id") REFERENCES "public"."parent_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_journal_lines" ADD CONSTRAINT "ledger_journal_lines_journal_entry_id_ledger_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."ledger_journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_journal_lines" ADD CONSTRAINT "ledger_journal_lines_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_journal_lines" ADD CONSTRAINT "ledger_journal_lines_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payouts" ADD CONSTRAINT "seller_payouts_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sub_order_id_sub_orders_id_fk" FOREIGN KEY ("sub_order_id") REFERENCES "public"."sub_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_base_target_currency" ON "exchange_rates" USING btree ("base_currency","target_currency");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_variant_warehouse" ON "inventory_levels" USING btree ("variant_id","warehouse_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_webhook_source_event" ON "webhook_events" USING btree ("source","event_id");