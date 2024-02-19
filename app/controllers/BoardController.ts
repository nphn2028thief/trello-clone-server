import { Request, Response } from "express";

import responseServer from "../configs/responseServer";
import BoardSchema from "../models/BoardSchema";
import { IImage } from "../types/board";

class BoardController {
  async createBoard(req: Request, res: Response) {
    const { organizationId, title, image } = req.body;

    if (!organizationId || !title || !image) {
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
        organizationId,
        title,
        image: storageImage,
      });
      return responseServer.success(res, "Board created!");
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getBoardsByOrgId(req: Request, res: Response) {
    const { organizationId } = req.params;

    if (!organizationId) {
      return responseServer.badRequest(res, "Organization is required!");
    }

    try {
      const boards = await BoardSchema.find({ organizationId }).lean();
      return res.json(boards);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getBoardByOrgIdAndBoardId(req: Request, res: Response) {
    const { organizationId, boardId } = req.params;

    if (!organizationId || !boardId) {
      return responseServer.badRequest(res);
    }

    try {
      const board = await BoardSchema.findOne({
        organizationId,
        _id: boardId,
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
      const deletedBoard = await BoardSchema.findByIdAndDelete(id);

      if (!deletedBoard) {
        return responseServer.notFound(res, "Board not found!");
      }

      return responseServer.success(res, "Board deleted!");
    } catch (error) {}
  }
}

export default new BoardController();
