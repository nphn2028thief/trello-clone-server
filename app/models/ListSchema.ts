import { Schema, model } from "mongoose";

import { IList } from "../types/list";

const ListSchema = new Schema<IList>(
  {
    title: { type: String, require: true },
    order: { type: Number, default: null },
    cardIds: [{ type: String, ref: "Card" }],
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default model<IList>("List", ListSchema);
