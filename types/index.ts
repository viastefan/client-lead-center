export const USER_ROLES = ["super_admin", "admin", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const WEBSITE_STATUSES = ["active", "inactive", "error"] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const LEAD_STATUSES = [
  "new",
  "in_progress",
  "waiting",
  "replied",
  "qualified",
  "closed",
  "spam",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const CONVERSATION_CHANNELS = ["website", "email", "manual"] as const;
export type ConversationChannel = (typeof CONVERSATION_CHANNELS)[number];

export const CONVERSATION_STATUSES = ["open", "closed"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_TYPES = ["website", "email", "ai", "internal"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const EMAIL_PROVIDERS = ["gmail", "microsoft"] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export const EMAIL_ACCOUNT_STATUSES = [
  "connected",
  "disconnected",
  "error",
] as const;
export type EmailAccountStatus = (typeof EMAIL_ACCOUNT_STATUSES)[number];

export const AUTOMATION_TRIGGERS = [
  "lead.created",
  "lead.updated",
  "message.created",
] as const;
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_ACTIONS = [
  "notify_client",
  "send_confirmation",
  "analyze_with_ai",
  "create_task",
  "send_email",
  "assign_lead",
] as const;
export type AutomationAction = (typeof AUTOMATION_ACTIONS)[number];

export type Profile = {
  id: string;
  role: UserRole;
  customer_id: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Website = {
  id: string;
  customer_id: string;
  name: string;
  domain: string;
  status: WebsiteStatus;
  active: boolean;
  api_key_hash: string;
  last_request_at: string | null;
  last_lead_at: string | null;
  vercel_project: string | null;
  vercel_url: string | null;
  github_repo: string | null;
  allowed_hosts: string[];
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  customer_id: string;
  website_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  source: string;
  page_url: string | null;
  metadata: Record<string, unknown> | null;
  status: LeadStatus;
  priority: LeadPriority;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  customer_id: string;
  lead_id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  customer_id: string;
  conversation_id: string;
  direction: MessageDirection;
  sender_name: string | null;
  sender_email: string | null;
  recipient_email: string | null;
  subject: string | null;
  body: string;
  message_type: MessageType;
  ai_generated: boolean;
  created_at: string;
};

export type EmailAccount = {
  id: string;
  customer_id: string;
  provider: EmailProvider;
  email: string;
  display_name: string | null;
  status: EmailAccountStatus;
  created_at: string;
  updated_at: string;
};

export type Automation = {
  id: string;
  customer_id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  customer_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type HealthComponentStatus = "operational" | "warning" | "error";

export type SystemHealth = {
  status: "ok" | "degraded" | "error";
  database: "connected" | "disconnected" | "unconfigured";
  timestamp: string;
  components: {
    api: HealthComponentStatus;
    database: HealthComponentStatus;
    storage: HealthComponentStatus;
    email: HealthComponentStatus;
    ai: HealthComponentStatus;
  };
};

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile | null;
};
