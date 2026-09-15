import { z } from "zod";
import { findOrCreateCustomer } from "@/lib/customers";
import { createOpportunityFromRequest } from "@/lib/pipeline";
import { notifyAdmins, notifyCustomer } from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api-utils";
import { forwardLeadToCenter } from "@/lib/lead-center";

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(5000).optional(),
  usage: z.string().max(2000).optional(),
  requirements: z.string().max(2000).optional(),
  modifications: z.string().max(2000).optional(),
  images: z.array(z.string()).max(3).optional(),
  productName: z.string().optional(),
  productId: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

function buildMessage(data: z.infer<typeof schema>): string {
  if (data.message) return data.message;

  const parts: string[] = [];
  if (data.usage) parts.push(`Einsatz:\n${data.usage}`);
  if (data.requirements) parts.push(`Anforderungen:\n${data.requirements}`);
  if (data.modifications) parts.push(`Anpassungswünsche:\n${data.modifications}`);
  return parts.join("\n\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const message = buildMessage(data);
    if (message.length < 10) {
      return handleApiError(new Error("Bitte beschreiben Sie Ihren Einsatz oder Ihre Anforderungen."));
    }

    const customer = await findOrCreateCustomer({
      email: data.email,
      name: data.name ?? data.email.split("@")[0],
      phone: data.phone,
    });

    const product = data.productId
      ? await prisma.product.findUnique({ where: { id: data.productId } })
      : null;

    const customRequest = await prisma.customRequest.create({
      data: {
        customerId: customer.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        productId: data.productId,
        productName: data.productName ?? product?.name,
        message,
        images: JSON.stringify(data.images ?? []),
        status: "NEW",
      },
    });

    await createOpportunityFromRequest({
      customerId: customer.id,
      customRequestId: customRequest.id,
      title: product
        ? `Anfrage: ${product.name}`
        : data.productName
          ? `Anfrage: ${data.productName}`
          : "Individuelle Beratungsanfrage",
      estimatedValue: product?.price,
    });

    await notifyCustomer(
      customer.id,
      "REQUEST_RECEIVED",
      "Anfrage eingegangen",
      "Wir haben Ihre Beratungsanfrage erhalten und melden uns innerhalb von 24 Stunden."
    );

    await notifyAdmins(
      "NEW_INQUIRY",
      "Neue Beratungsanfrage",
      `${customer.name} — ${message.slice(0, 80)}…`,
      { requestId: customRequest.id }
    );

    await forwardLeadToCenter({
      name: customer.name,
      email: data.email,
      phone: data.phone,
      message,
      source: "website",
      metadata: { productName: data.productName, productId: data.productId },
    });

    return jsonOk({ ok: true, requestId: customRequest.id });
  } catch (error) {
    return handleApiError(error);
  }
}
