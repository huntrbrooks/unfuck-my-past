import { pgTable, serial, text, timestamp, boolean, integer, jsonb, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk userId
  createdAt: timestamp('created_at').defaultNow(),
  tone: text('tone'), voice: text('voice'), rawness: text('rawness'),
  depth: text('depth'), learning: text('learning'), engagement: text('engagement'),
  safety: jsonb('safety'),
});

export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  questionId: integer('question_id').notNull(),
  modality: text('modality').notNull(), // text | voice
  content: text('content'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  product: text('product').notNull(), // diagnostic | program
  stripePaymentIntent: text('pi'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const programDays = pgTable('program_days', {
  day: integer('day').primaryKey(),
  title: text('title'),
  copyStraight: text('copy_straight'),
  copyGentle: text('copy_gentle'),
  metadata: jsonb('metadata'),
});

export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  day: integer('day').notNull(),
  completedAt: timestamp('completed_at'),
});

export const journals = pgTable('journals', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  day: integer('day'),
  body: text('body'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const moods = pgTable('moods', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  day: integer('day'),
  score: integer('score'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const diagnosticResponses = pgTable('diagnostic_responses', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  question: jsonb('question').notNull(),
  response: text('response').notNull(),
  insight: text('insight'),
  model: text('model'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const diagnosticSummaries = pgTable('diagnostic_summaries', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'comprehensive' | 'comprehensive_report'
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  // Add unique constraint on userId and type combination
  userIdTypeUnique: unique('user_id_type_unique').on(table.userId, table.type),
}));

// Preference audits for versioning and revert support
export const preferenceAudits = pgTable('preference_audits', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  changes: jsonb('changes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Analytics events (session, page views, heartbeats, conversions)
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  sessionId: text('session_id'),
  event: text('event').notNull(),
  path: text('path'),
  title: text('title'),
  properties: jsonb('properties'),
  clientTimestamp: timestamp('client_ts'),
  serverTimestamp: timestamp('server_ts').defaultNow(),
});

