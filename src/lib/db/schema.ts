import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  primaryKey,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  googleConnections: many(googleConnections),
  sites: many(sites),
  subscriptions: many(subscriptions),
}));

// ─── NextAuth Accounts (login identity) ──────────────────────────────────────

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

// ─── NextAuth Sessions ───────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// ─── NextAuth Verification Tokens ────────────────────────────────────────────

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Google API Connections (separate from login) ────────────────────────────

export const googleConnections = pgTable(
  "google_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleEmail: text("google_email").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { mode: "date" }),
    scopes: text("scopes").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (gc) => [index("google_connections_user_idx").on(gc.userId)]
);

export const googleConnectionsRelations = relations(
  googleConnections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [googleConnections.userId],
      references: [users.id],
    }),
    sites: many(sites),
  })
);

// ─── Sites ───────────────────────────────────────────────────────────────────

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleConnectionId: uuid("google_connection_id").references(
      () => googleConnections.id,
      { onDelete: "set null" }
    ),
    url: text("url").notNull(),
    name: text("name").notNull(),
    ga4PropertyId: text("ga4_property_id"),
    gscSiteUrl: text("gsc_site_url"),
    lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (s) => [index("sites_user_idx").on(s.userId)]
);

export const sitesRelations = relations(sites, ({ one, many }) => ({
  user: one(users, { fields: [sites.userId], references: [users.id] }),
  googleConnection: one(googleConnections, {
    fields: [sites.googleConnectionId],
    references: [googleConnections.id],
  }),
  metricsSnapshots: many(metricsSnapshots),
  audits: many(audits),
  reports: many(reports),
}));

// ─── Metrics Snapshots ───────────────────────────────────────────────────────

export const metricsSnapshots = pgTable(
  "metrics_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    snapshotDate: timestamp("snapshot_date", { mode: "date" }).notNull(),
    sessions: integer("sessions"),
    mobilePercent: real("mobile_percent"),
    bounceRate: real("bounce_rate"),
    clicks: integer("clicks"),
    impressions: integer("impressions"),
    ctr: real("ctr"),
    avgPosition: real("avg_position"),
    indexedPages: integer("indexed_pages"),
    lcp: real("lcp"),
    cls: real("cls"),
    fid: real("fid"),
    topQueries: jsonb("top_queries").$type<
      {
        query: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }[]
    >(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (ms) => [
    index("metrics_site_date_idx").on(ms.siteId, ms.snapshotDate),
  ]
);

export const metricsSnapshotsRelations = relations(
  metricsSnapshots,
  ({ one }) => ({
    site: one(sites, {
      fields: [metricsSnapshots.siteId],
      references: [sites.id],
    }),
  })
);

// ─── Audits ──────────────────────────────────────────────────────────────────

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    status: text("status")
      .$type<"pending" | "running" | "completed" | "failed">()
      .notNull()
      .default("pending"),
    overallScore: integer("overall_score"),
    scores: jsonb("scores").$type<{
      performance: number;
      content: number;
      technical: number;
      local: number;
    }>(),
    issues: jsonb("issues").$type<
      {
        ruleId: string;
        severity: "critical" | "warning" | "info";
        title: string;
        description: string;
        metric: string;
        currentValue: number;
        threshold: number;
      }[]
    >(),
    recommendations: jsonb("recommendations").$type<
      {
        priority: number;
        title: string;
        description: string;
        actionItems: string[];
        relatedIssues: string[];
      }[]
    >(),
    checklist: jsonb("checklist").$type<
      {
        id: string;
        label: string;
        completed: boolean;
        category: "technical" | "content" | "local" | "performance";
      }[]
    >(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (a) => [index("audits_site_idx").on(a.siteId)]
);

export const auditsRelations = relations(audits, ({ one }) => ({
  site: one(sites, { fields: [audits.siteId], references: [sites.id] }),
}));

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id").references(() => audits.id, {
      onDelete: "set null",
    }),
    pdfUrl: text("pdf_url").notNull(),
    reportMonth: text("report_month").notNull(), // "2026-02"
    sentViaEmail: boolean("sent_via_email").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (r) => [index("reports_site_idx").on(r.siteId)]
);

export const reportsRelations = relations(reports, ({ one }) => ({
  site: one(sites, { fields: [reports.siteId], references: [sites.id] }),
  audit: one(audits, { fields: [reports.auditId], references: [audits.id] }),
}));

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    alertType: text("alert_type")
      .$type<"regression" | "improvement" | "warning">()
      .notNull(),
    metric: text("metric").notNull(),
    previousValue: real("previous_value").notNull(),
    currentValue: real("current_value").notNull(),
    changePercent: real("change_percent").notNull(),
    message: text("message").notNull(),
    emailSent: boolean("email_sent").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (a) => [index("alerts_site_idx").on(a.siteId)]
);

export const alertsRelations = relations(alerts, ({ one }) => ({
  site: one(sites, { fields: [alerts.siteId], references: [sites.id] }),
}));

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    status: text("status")
      .$type<
        "active" | "canceled" | "past_due" | "trialing" | "unpaid" | "incomplete"
      >()
      .notNull()
      .default("incomplete"),
    currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
    currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (s) => [
    index("subscriptions_user_idx").on(s.userId),
    index("subscriptions_stripe_customer_idx").on(s.stripeCustomerId),
  ]
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));
