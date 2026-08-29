interface CalendarEventInput {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
}

function toGoogleDate(iso: string) {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarUrl(event: CalendarEventInput) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${toGoogleDate(event.startIso)}/${toGoogleDate(event.endIso)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toIcsDate(iso: string) {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildIcsContent(event: CalendarEventInput & { uid: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NearCut//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startIso)}`,
    `DTEND:${toIcsDate(event.endIso)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(event: CalendarEventInput & { uid: string }) {
  const content = buildIcsContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.uid}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
