import "dotenv/config";
import { google, calendar_v3 } from "googleapis";

let _client: calendar_v3.Calendar | null = null;

function getClient(): calendar_v3.Calendar {
  if (_client) return _client;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY が未設定です。E2E ヘルパーは実カレンダーに接続します"
    );
  }
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  _client = google.calendar({ version: "v3", auth });
  return _client;
}

export type CalendarEvent = calendar_v3.Schema$Event;

function toIso(d: Date): string {
  return d.toISOString();
}

export async function listRecentEvents(
  calendarId: string,
  from: Date,
  to: Date
): Promise<CalendarEvent[]> {
  const client = getClient();
  const res = await client.events.list({
    calendarId,
    timeMin: toIso(from),
    timeMax: toIso(to),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });
  return res.data.items ?? [];
}

export async function findEventBySummary(
  calendarId: string,
  summaryContains: string,
  from: Date,
  to: Date
): Promise<CalendarEvent | undefined> {
  const events = await listRecentEvents(calendarId, from, to);
  return events.find((e) => (e.summary ?? "").includes(summaryContains));
}

export async function deleteEventById(
  calendarId: string,
  eventId: string
): Promise<void> {
  const client = getClient();
  await client.events.delete({ calendarId, eventId });
}

/**
 * summary に特定文字列を含むイベントを指定期間から一括削除。
 * 削除件数を返す。テスト失敗時の掃除に使用。
 */
export async function deleteEventsBySummaryContains(
  calendarId: string,
  summaryContains: string,
  from: Date,
  to: Date
): Promise<number> {
  const events = await listRecentEvents(calendarId, from, to);
  const matched = events.filter((e) =>
    (e.summary ?? "").includes(summaryContains)
  );
  for (const ev of matched) {
    if (ev.id) await deleteEventById(calendarId, ev.id);
  }
  return matched.length;
}
