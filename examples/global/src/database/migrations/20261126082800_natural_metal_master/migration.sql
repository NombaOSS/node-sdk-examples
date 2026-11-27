CREATE TABLE `inflows` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`reference` text NOT NULL UNIQUE,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount` integer,
	`currency` text,
	`phone_number` text,
	`topup_vendor` text,
	`request_payload` text,
	`response_payload` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`reference` text NOT NULL UNIQUE,
	`transaction_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount` integer,
	`source_currency` text,
	`destination_currency` text,
	`request_payload` text,
	`response_payload` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`event_type` text,
	`transaction_id` text,
	`signature_valid` integer NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`error` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
