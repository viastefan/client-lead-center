import { logger } from "@/lib/logger";
import type { AutomationAction, AutomationTrigger } from "@/types";

export type AutomationEvent = {
  type: AutomationTrigger;
  customerId: string;
  leadId: string;
  payload: Record<string, unknown>;
};

const handlers: Record<AutomationAction, (event: AutomationEvent) => Promise<void>> = {
  notify_client: async (event) => {
    logger.info("automation.notify_client.queued", event);
  },
  send_confirmation: async (event) => {
    logger.info("automation.send_confirmation.queued", event);
  },
  analyze_with_ai: async (event) => {
    logger.info("automation.analyze_with_ai.queued", event);
  },
  create_task: async (event) => {
    logger.info("automation.create_task.queued", event);
  },
  send_email: async (event) => {
    logger.info("automation.send_email.queued", event);
  },
  assign_lead: async (event) => {
    logger.info("automation.assign_lead.queued", event);
  },
};

export async function enqueueAutomationEvent(event: AutomationEvent) {
  logger.info("automation.event.recorded", {
    type: event.type,
    customerId: event.customerId,
    leadId: event.leadId,
  });
}

export async function runAutomationAction(
  action: AutomationAction,
  event: AutomationEvent,
) {
  const handler = handlers[action];
  await handler(event);
}
