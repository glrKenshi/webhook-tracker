export type WebhookEndpoint = {
  id: number;
  name: string;
  token: string;
  url: string;
  created_at: string;
};

export type WebhookEvent = {
  id: number;
  webhook_endpoint_id: number;
  http_method: string;
  headers: string;
  body: string | null;
  content_type: string | null;
  created_at: string;
};
