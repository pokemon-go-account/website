import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import crypto from "crypto";
import { POST as razorpayWebhookPOST } from "@/app/api/webhooks/razorpay/route";
import Registration from "@/models/Registration";
import User from "@/models/User";
import WebhookLog from "@/models/WebhookLog";

describe("Razorpay Webhook Handler", () => {
  const webhookSecret = "test_secret_123";

  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Registration.deleteMany({});
    await User.deleteMany({});
    await WebhookLog.deleteMany({});
  });

  const createRequest = (bodyObj: any, signatureHeader?: string) => {
    const rawBody = JSON.stringify(bodyObj);
    const headers = new Headers();
    headers.set("content-type", "application/json");
    if (signatureHeader !== undefined) {
      headers.set("x-razorpay-signature", signatureHeader);
    } else {
      // Generate valid signature using crypto HMAC
      const sig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      headers.set("x-razorpay-signature", sig);
    }
    return new Request("http://localhost/api/webhooks/razorpay", {
      method: "POST",
      headers,
      body: rawBody,
    });
  };

  it("should fail if x-razorpay-signature header is missing", async () => {
    const payload = { id: "evt_1", event: "payment.captured" };
    const req = new Request("http://localhost/api/webhooks/razorpay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Missing signature header");

    const log = await WebhookLog.findOne({ eventId: "evt_1" });
    expect(log?.status).toBe("FAILED");
    expect(log?.errorMessage).toContain("Missing signature header");
  });

  it("should fail if signature verification fails", async () => {
    const payload = { id: "evt_2", event: "payment.captured" };
    const req = createRequest(payload, "invalid_sig");

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Signature verification failed");
  });

  it("should fail if payment.captured payload is missing the order_id", async () => {
    const payload = {
      id: "evt_3",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            amount: 250,
            currency: "USD",
          },
        },
      },
    };
    const req = createRequest(payload);

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("No order ID associated with payment");
  });

  it("should fail if payment amount or currency does not match 250 USD", async () => {
    const payload = {
      id: "evt_4",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            order_id: "order_xyz",
            amount: 500, // Expected 250
            currency: "USD",
          },
        },
      },
    };
    const req = createRequest(payload);

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Invalid payment amount or currency");
  });

  it("should fail if no registration tracking record matches the order ID", async () => {
    const payload = {
      id: "evt_5",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            order_id: "order_unregistered",
            amount: 250,
            currency: "USD",
          },
        },
      },
    };
    const req = createRequest(payload);

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error).toContain("No registration found matching order ID");
  });

  it("should verify registration, update user properties, and trigger success", async () => {
    const user = (await User.create({
      name: "Webhook Buyer",
      email: "web@example.com",
      hasPaidVerificationDeposit: false,
      walletBalance: 0,
    })) as any;

    const reg = (await Registration.create({
      userId: user._id,
      auctionId: new mongoose.Types.ObjectId(),
      razorpayOrderId: "order_success_123",
      status: "PENDING",
    })) as any;

    const payload = {
      id: "evt_6",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            order_id: "order_success_123",
            amount: 250,
            currency: "USD",
          },
        },
      },
    };
    const req = createRequest(payload);

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    const updatedReg = await Registration.findById(reg._id);
    expect(updatedReg?.status).toBe("PAID");

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.hasPaidVerificationDeposit).toBe(true);
    expect(updatedUser?.walletBalance).toBe(2.5);

    const log = await WebhookLog.findOne({ eventId: "evt_6" });
    expect(log?.status).toBe("PROCESSED");
  });

  it("should bypass duplicate events gracefully (Idempotency check)", async () => {
    const user = (await User.create({
      name: "Idempotent Buyer",
      email: "idem@example.com",
      hasPaidVerificationDeposit: true,
      walletBalance: 2.5,
    })) as any;

    const reg = (await Registration.create({
      userId: user._id,
      auctionId: new mongoose.Types.ObjectId(),
      razorpayOrderId: "order_duplicate_123",
      status: "PAID", // Already processed
    })) as any;

    const payload = {
      id: "evt_7",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            order_id: "order_duplicate_123",
            amount: 250,
            currency: "USD",
          },
        },
      },
    };
    const req = createRequest(payload);

    const res = await razorpayWebhookPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("Idempotent event bypassed");

    const log = await WebhookLog.findOne({ eventId: "evt_7" });
    expect(log?.status).toBe("DUPLICATE");
  });
});
