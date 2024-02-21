import { Request, Response } from "express";

import responseServer from "../configs/responseServer";
import BoardSchema from "../models/BoardSchema";
import ListSchema from "../models/ListSchema";

class ListController {
  async createList(req: Request, res: Response) {
    const { title, boardId, organizationId } = req.body;

    if (!title || !boardId || !organizationId) {
      return responseServer.badRequest(res);
    }

    try {
      const board = await BoardSchema.findOne({
        _id: boardId,
        organizationId,
      }).lean();

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      const lengthOfList = (await ListSchema.find().lean()).length;

      const createdList = await ListSchema.create({
        title,
        order: lengthOfList ? lengthOfList + 1 : 1,
      });

      await BoardSchema.findByIdAndUpdate(
        board._id,
        {
          $push: {
            listIds: createdList._id,
          },
        },
        { new: true }
      );

      return responseServer.success(res, "List created!");
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getListsByBoardAndOrg(req: Request, res: Response) {
    const { boardId, orgId } = req.params;

    if (!boardId || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      // Get list with board id in 1-n relationship
      const board = await BoardSchema.findOne({
        _id: boardId,
        organizationId: orgId,
      }).lean();

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      const listsId = board.listIds;

      const lists = await ListSchema.find({
        _id: {
          $in: listsId,
        },
      }).lean();
      // .populate("cardIds")

      return res.json(lists);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async updateList(req: Request, res: Response) {
    const { id } = req.params;
    const { title } = req.body;

    if (!id) {
      return responseServer.badRequest(res, "List is invalid!");
    }

    try {
      const updatedList = await ListSchema.findByIdAndUpdate(id, {
        $set: {
          title,
        },
      });

      if (!updatedList) {
        return responseServer.notFound(res, "List not found!");
      }

      return responseServer.success(res, "Updated list!");
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new ListController();
