PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`reference` text NOT NULL UNIQUE,
	`transaction_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`amount` integer,
	`source_currency` text,
	`destination_currency` text,
	`request_payload` text,
	`response_payload` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_payouts`(`id`, `reference`, `transaction_id`, `type`, `status`, `amount`, `source_currency`, `destination_currency`, `request_payload`, `response_payload`, `created_at`, `updated_at`) SELECT `id`, `reference`, `transaction_id`, `type`, `status`, `amount`, `source_currency`, `destination_currency`, `request_payload`, `response_payload`, `created_at`, `updated_at` FROM `payouts`;--> statement-breakpoint
DROP TABLE `payouts`;--> statement-breakpoint
ALTER TABLE `__new_payouts` RENAME TO `payouts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;