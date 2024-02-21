import { Schema, model } from "mongoose";

import { ICard } from "../types/card";

const CardSchema = new Schema<ICard>(
  {
    title: { type: String, require: true },
    description: { type: String, default: null },
    order: { type: Number, default: null },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default model<ICard>("Card", CardSchema);