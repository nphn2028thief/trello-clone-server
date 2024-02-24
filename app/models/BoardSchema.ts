import { Schema, model } from "mongoose";

import { IBoard } from "../types/board";

const BoardSchema = new Schema<IBoard>(
  {
    orgId: { type: String, required: true },
    title: { type: String, require: true },
    image: {
      id: { type: String, required: true },
      thumbUrl: { type: String, required: true },
      fullUrl: { type: String, required: true },
      username: { type: String, required: true },
      linkHtml: { type: String, required: true },
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default model<IBoard>("Board", BoardSchema);
