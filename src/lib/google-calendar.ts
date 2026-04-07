import { google } from "googleapis";

function getCalendarClient() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

export type BusyPeriod = { start: string; end: string };

export async function getAvailability(
  calendarId: string,
  date: string,
  timezone: string
): Promise<BusyPeriod[]> {
  const timeMin = `${date}T00:00:00`;
  const timeMax = `${date}T23:59:59`;

  const calendar = getCalendarClient();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(`${timeMin}+09:00`).toISOString(),
      timeMax: new Date(`${timeMax}+09:00`).toISOString(),
      timeZone: timezone,
      items: [{ id: calendarId }],
    },
  });

  const busy = res.data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({
    start: b.start!,
    end: b.end!,
  }));
}

export async function createBookingEvent(
  calendarId: string,
  booking: {
    storeName: string;
    courseName: string;
    customerName: string;
    email: string;
    phone?: string;
    note?: string;
    startTime: string;
    endTime: string;
    timezone: string;
  }
) {
  const calendar = getCalendarClient();
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `【予約】${booking.customerName}様 - ${booking.courseName}`,
      description: [
        `お客様名: ${booking.customerName}`,
        `メール: ${booking.email}`,
        booking.phone ? `電話: ${booking.phone}` : null,
        booking.note ? `備考: ${booking.note}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      start: {
        dateTime: booking.startTime,
        timeZone: booking.timezone,
      },
      end: {
        dateTime: booking.endTime,
        timeZone: booking.timezone,
      },
    },
  });

  return res.data.id!;
}

export async function deleteEvent(calendarId: string, eventId: string) {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId, eventId });
}
