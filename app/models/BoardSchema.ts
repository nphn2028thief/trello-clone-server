import { Schema, model } from "mongoose";

import { IBoard } from "../types/board";

const BoardSchema = new Schema<IBoard>({
  title: { type: String, require: true },
});

export default model<IBoard>("Board", BoardSchema);
