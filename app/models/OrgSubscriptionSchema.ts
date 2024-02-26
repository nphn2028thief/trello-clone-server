import { Schema, model } from "mongoose";

import { IOrgSubscription } from "../types/orgSubscription";

const OrgSubscriptionSchema = new Schema<IOrgSubscription>(
  {
    orgId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, required: true, unique: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    stripePriceId: { type: String, required: true },
    stripeCurrentPeriodEnd: { type: Date, required: true },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default model<IOrgSubscription>(
  "OrgSubscription",
  OrgSubscriptionSchema
);
