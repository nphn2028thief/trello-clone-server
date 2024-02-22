import { Request, Response } from "express";
import _ from "lodash";

import responseServer from "../configs/responseServer";
import BoardSchema from "../models/BoardSchema";
import ListSchema from "../models/ListSchema";
import CardSchema from "../models/CardSchema";

class ListController {
  async createList(req: Request, res: Response) {
    const { title, boardId, orgId } = req.body;

    if (!title || !boardId || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      const board = await BoardSchema.findOne({
        _id: boardId,
        orgId,
      })
        .lean()
        .populate("listIds");

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      const lengthOfList = board.listIds.length;

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

      return responseServer.success(res, `List "${title}" created!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getLists(req: Request, res: Response) {
    const { boardId, orgId } = req.params;

    if (!boardId || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      // Get list with board id in 1-n relationship
      const board = await BoardSchema.findOne({
        _id: boardId,
        orgId,
      }).lean();

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      const listsId = board.listIds;

      const lists = await ListSchema.find({
        _id: {
          $in: listsId,
        },
      })
        .lean()
        .populate("cardIds")
        .sort({ order: "asc" });

      return res.json(
        lists.map((item) => ({
          ..._.omit(item, "cardIds"),
          cards: item.cardIds,
        }))
      );
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

  async copyList(req: Request, res: Response) {
    const { listId, title, boardId, orgId, cards } = req.body;

    if (!listId || !title || !boardId || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      const board = await BoardSchema.findOne({
        _id: boardId,
        orgId,
      })
        .lean()
        .populate("listIds");

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      const list = await ListSchema.findById(listId).lean();

      if (!list) {
        return responseServer.notFound(res, "List not found!");
      }

      let createdCards;

      if (cards.length) {
        createdCards = await CardSchema.insertMany(cards);
      }

      await ListSchema.updateMany(
        {
          order: {
            $gte: list.order + 1,
          },
        },
        {
          $inc: {
            order: 1,
          },
        }
      );

      const createdList = await ListSchema.create({
        title: `${title} - Copy`,
        order: list ? list.order + 1 : 1,
        cardIds: createdCards || [],
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

      return responseServer.success(res, `List ${title} copied!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async deleteList(req: Request, res: Response) {
    const { id, boardId, orgId } = req.params;

    if (!id || !boardId || !orgId) {
      return responseServer.badRequest(res, "List is invalid!");
    }

    try {
      const deletedList = await ListSchema.findByIdAndDelete(id).lean();

      if (!deletedList) {
        return responseServer.notFound(res, "List not found!");
      }

      await ListSchema.updateMany(
        {
          order: {
            $gte: deletedList.order + 1,
          },
        },
        {
          $inc: {
            order: -1,
          },
        }
      );

      await BoardSchema.findOneAndUpdate(
        { _id: boardId, orgId },
        {
          $pull: {
            listIds: deletedList._id,
          },
        },
        {
          new: true,
        }
      );

      return responseServer.success(
        res,
        `List "${deletedList.title}" deleted!`
      );
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new ListController();
