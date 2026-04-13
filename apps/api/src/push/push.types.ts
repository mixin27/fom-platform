export type PushDispatchMessage = {
  device_id: string;
  provider: string;
  platform: string;
  push_token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushDispatchResult = {
  device_id: string;
  delivered: boolean;
  provider_message_id?: string | null;
  error?: string | null;
};
