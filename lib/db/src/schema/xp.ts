import { pgTable, text, integer, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const xpTable = pgTable(
  "xp",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    guildId: text("guild_id").notNull(),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(0),
    lastMessageAt: timestamp("last_message_at"),
  },
  (table) => [uniqueIndex("xp_user_guild_idx").on(table.userId, table.guildId)]
);

export type XpRow = typeof xpTable.$inferSelect;
export type InsertXp = typeof xpTable.$inferInsert;

export const guildSettingsTable = pgTable("guild_settings", {
  guildId: text("guild_id").primaryKey(),
  welcomeChannel: text("welcome_channel"),
  welcomeMessage: text("welcome_message"),
  announceChannel: text("announce_channel"),
});

export type GuildSettings = typeof guildSettingsTable.$inferSelect;
