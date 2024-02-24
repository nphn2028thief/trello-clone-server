import { Schema, model } from "mongoose";

import { IList } from "../types/list";

const ListSchema = new Schema<IList>(
  {
    title: { type: String, require: true },
    order: { type: Number, default: null },
    boardId: { type: String, ref: "Board" },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

ListSchema.index({ order: 1 });

export default model<IList>("List", ListSchema);
