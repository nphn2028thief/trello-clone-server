import { Schema, model } from "mongoose";

import { IOrgLimitSchema } from "../types/orgLimit";

const OrgLimitSchema = new Schema<IOrgLimitSchema>(
  {
    orgId: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default model<IOrgLimitSchema>("OrgLimit", OrgLimitSchema);
