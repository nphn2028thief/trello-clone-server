import { Schema, model } from "mongoose";

import { ACTION, ENTITY_TYPE } from "../constants/log";
import { ILogSchema } from "../types/log";

const LogSchema = new Schema<ILogSchema>(
  {
    action: { type: String, enum: Object.values(ACTION), required: true },
    orgId: { type: String, required: true },
    entity: {
      id: { type: String, required: true },
      type: {
        type: String,
        enum: Object.values(ENTITY_TYPE),
        required: true,
      },
      title: { type: String, required: true },
    },
    user: {
      id: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      image: { type: String, required: true },
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default model<ILogSchema>("Log", LogSchema);
