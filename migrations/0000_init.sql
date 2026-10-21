CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permission_level_resource_action_key` ON `permissions` (`level`,`resource`,`action`);--> statement-breakpoint
CREATE INDEX `permission_level_idx` ON `permissions` (`level`);--> statement-breakpoint
CREATE INDEX `permission_resource_idx` ON `permissions` (`resource`);--> statement-breakpoint
CREATE INDEX `permission_action_idx` ON `permissions` (`action`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`role_name` text DEFAULT 'USER' NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_name_unique` ON `roles` (`role_name`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_permission_unique` ON `role_permissions` (`role_id`,`permission_id`);--> statement-breakpoint
CREATE INDEX `role_permission_role_idx` ON `role_permissions` (`role_id`);--> statement-breakpoint
CREATE INDEX `role_permission_permission_idx` ON `role_permissions` (`permission_id`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_role_unique` ON `user_roles` (`user_id`,`role_id`);--> statement-breakpoint
CREATE INDEX `user_role_role_id_idx` ON `user_roles` (`role_id`);--> statement-breakpoint
CREATE INDEX `user_role_user_id_idx` ON `user_roles` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text NOT NULL,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`locale` text DEFAULT 'en-US' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `user_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`browser` text,
	`os` text,
	`device_type` text,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_device_user_fingerprint_idx` ON `user_devices` (`user_id`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `user_device_user_id_idx` ON `user_devices` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text,
	`session_id` text NOT NULL,
	`login_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`logout_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `user_devices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_session_user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_session_session_id_idx` ON `user_sessions` (`session_id`);--> statement-breakpoint
CREATE INDEX `user_session_login_at_idx` ON `user_sessions` (`login_at`);--> statement-breakpoint
CREATE INDEX `user_session_last_seen_at_idx` ON `user_sessions` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `user_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text,
	`event` text NOT NULL,
	`session_id` text,
	`device_id` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `user_devices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_event_user_id_idx` ON `user_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_event_event_idx` ON `user_events` (`event`);--> statement-breakpoint
CREATE INDEX `user_event_created_at_idx` ON `user_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_event_session_id_idx` ON `user_events` (`session_id`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_accountProvider_accountId_idx` ON `accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`street_line_1` text NOT NULL,
	`street_line_2` text,
	`city` text NOT NULL,
	`state` text,
	`zip_code` text NOT NULL,
	`country` text NOT NULL,
	`latitude` numeric,
	`longitude` numeric,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_expiresAt_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
