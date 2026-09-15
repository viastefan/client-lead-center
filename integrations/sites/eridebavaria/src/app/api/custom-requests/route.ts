import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/customers";
import { createOpportunityFromRequest } from "@/lib/pipeline";
import { notifyAdmins, notifyCustomer } from "@/lib/notifications";
import { jsonOk, handleApiError } from "@/lib/api-utils";
import { forwardLeadToCenter } from "@/lib/lead-center";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10).max(5000),
  productId: z.string().optional(),
  productName: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const data = schema.parse(body);

    const customer = await findOrCreateCustomer({
      email: data.email,
      name: data.name ?? data.email.split("@")[0],
      phone: data.phone,
      userId: session?.id,
    });

    const customRequest = await prisma.customRequest.create({
      data: {
        customerId: customer.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        productId: data.productId,
        productName: data.productName,
        message: data.message,
        images: JSON.stringify(data.images ?? []),
        status: "NEW",
      },
    });

    const product = data.productId
      ? await prisma.product.findUnique({ where: { id: data.productId } })
      : null;

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
      `${customer.name} — ${data.message.slice(0, 80)}…`,
      { requestId: customRequest.id }
    );

    // Legacy table for backwards compatibility
    await prisma.consultationRequest.create({
      data: {
        email: data.email,
        message: data.message,
        productName: data.productName ?? product?.name,
      },
    });

    await forwardLeadToCenter({
      name: data.name ?? data.email.split("@")[0],
      email: data.email,
      phone: data.phone,
      message: data.message,
      source: "website",
      metadata: { productName: data.productName, productId: data.productId },
    });

    return jsonOk({ ok: true, requestId: customRequest.id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const { requireStaff } = await import("@/lib/auth");
    await requireStaff();

    const requests = await prisma.customRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, product: true, opportunity: true },
    });

    return jsonOk({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}
