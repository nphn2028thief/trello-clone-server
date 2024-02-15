import { Request, Response } from "express";

import responseServer from "../configs/responseServer";
import BoardSchema from "../models/BoardSchema";

class BoardController {
  async createBoard(req: Request, res: Response) {
    const { title } = req.body;

    if (!title) {
      return responseServer.badRequest(res);
    }

    try {
      await BoardSchema.create({ title });
      return responseServer.success(res, "Create board successfully!");
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getBoards(req: Request, res: Response) {
    try {
      const boards = await BoardSchema.find().lean();
      return res.json(boards);
    } catch (error) {
      console.log(error);
      return responseServer.error(res);
    }
  }
}

export default new BoardController();
