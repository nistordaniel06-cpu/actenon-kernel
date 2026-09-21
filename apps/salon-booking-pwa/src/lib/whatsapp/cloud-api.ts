type WhatsAppListRow = {
  id: string;
  title: string;
  description?: string;
};

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  if (!accessToken || !graphVersion) {
    throw new Error("WhatsApp Cloud API nu este configurat pe server.");
  }
  return { accessToken, graphVersion };
}

async function send(phoneNumberId: string, payload: Record<string, unknown>) {
  const { accessToken, graphVersion } = getConfig();
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`WhatsApp Cloud API ${response.status}: ${detail.slice(0, 500)}`);
  }

  return response.json();
}

export function sendWhatsAppText(phoneNumberId: string, to: string, body: string) {
  return send(phoneNumberId, {
    to,
    type: "text",
    text: { body, preview_url: false },
  });
}

export function sendWhatsAppList(input: {
  phoneNumberId: string;
  to: string;
  body: string;
  button: string;
  sectionTitle: string;
  rows: WhatsAppListRow[];
}) {
  // Meta list messages accept up to 10 rows in the common interactive-list flow.
  const rows = input.rows.slice(0, 10).map((row) => ({
    id: row.id.slice(0, 200),
    title: row.title.slice(0, 24),
    ...(row.description ? { description: row.description.slice(0, 72) } : {}),
  }));

  return send(input.phoneNumberId, {
    to: input.to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: input.body },
      action: {
        button: input.button.slice(0, 20),
        sections: [{ title: input.sectionTitle.slice(0, 24), rows }],
      },
    },
  });
}
