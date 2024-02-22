import { Request, Response } from "express";

import responseServer from "../configs/responseServer";
import BoardSchema from "../models/BoardSchema";
import ListSchema from "../models/ListSchema";
import { IImage } from "../types/board";

class BoardController {
  async createBoard(req: Request, res: Response) {
    const { orgId, title, image } = req.body;

    if (!orgId || !title || !image) {
      return responseServer.badRequest(res);
    }

    try {
      const storageImage: IImage = {
        id: image.split("|")[0],
        thumbUrl: image.split("|")[1],
        fullUrl: image.split("|")[2],
        username: image.split("|")[3],
        linkHtml: image.split("|")[4],
      };

      await BoardSchema.create({
        orgId,
        title,
        image: storageImage,
      });
      return responseServer.success(res, "Board created!");
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getBoards(req: Request, res: Response) {
    const { orgId } = req.params;

    if (!orgId) {
      return responseServer.badRequest(res, "Organization is required!");
    }

    try {
      const boards = await BoardSchema.find({ orgId }).lean();
      return res.json(boards);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getBoardById(req: Request, res: Response) {
    const { orgId, boardId } = req.params;

    if (!orgId || !boardId) {
      return responseServer.badRequest(res);
    }

    try {
      const board = await BoardSchema.findOne({
        _id: boardId,
        orgId,
      }).lean();

      if (!board) {
        return responseServer.notFound(res, "Board is not found!");
      }

      return res.json(board);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async updateBoard(req: Request, res: Response) {
    const { id } = req.params;
    const { title } = req.body;

    if (!id) {
      return responseServer.badRequest(res, "Board is invalid!");
    }

    try {
      const updatedBoard = await BoardSchema.findByIdAndUpdate(
        id,
        {
          $set: {
            title,
          },
        },
        {
          new: true,
        }
      );

      if (!updatedBoard) {
        return responseServer.notFound(res, "Board not found!");
      }

      return responseServer.success(
        res,
        "Updated board!",
        "data",
        updatedBoard
      );
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async deleteBoard(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      return responseServer.badRequest(res);
    }

    try {
      const board = await BoardSchema.findByIdAndDelete(id).lean();

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      await ListSchema.deleteMany({ _id: board.listIds });

      return responseServer.success(res, "Board deleted!");
    } catch (error) {}
  }
}

export default new BoardController();
