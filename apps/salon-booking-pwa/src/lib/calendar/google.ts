type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type GoogleCalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  timezone: string;
};

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google Calendar OAuth nu este configurat.");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleOAuthUrl(state: string) {
  const { clientId, redirectUri } = googleConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google OAuth exchange failed: ${response.status}`);
  return response.json();
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = googleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google OAuth refresh failed: ${response.status}`);
  return response.json();
}

async function calendarRequest(
  accessToken: string,
  calendarId: string,
  path: string,
  init: RequestInit,
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar API ${response.status}: ${body.slice(0, 500)}`);
  }
  return response.status === 204 ? null : response.json();
}

function eventBody(event: GoogleCalendarEvent) {
  return {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: { dateTime: event.startAt, timeZone: event.timezone },
    end: { dateTime: event.endAt, timeZone: event.timezone },
  };
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEvent,
) {
  return calendarRequest(accessToken, calendarId, "", {
    method: "POST",
    body: JSON.stringify(eventBody(event)),
  }) as Promise<{ id: string; htmlLink?: string }>;
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEvent,
) {
  return calendarRequest(accessToken, calendarId, `/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify(eventBody(event)),
  });
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
) {
  return calendarRequest(accessToken, calendarId, `/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
}
