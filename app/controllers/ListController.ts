import { Request, Response } from "express";
import mongoose from "mongoose";

import responseServer from "../configs/responseServer";
import ListSchema from "../models/ListSchema";
import CardSchema from "../models/CardSchema";
import { IUpdateOrderList } from "../types/list";

class ListController {
  async createList(req: Request, res: Response) {
    const { title, boardId, orgId } = req.body;

    if (!title || !boardId || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      const lengthOfList = await ListSchema.find({ boardId }).lean();

      await ListSchema.create({
        title,
        order: lengthOfList ? lengthOfList.length + 1 : 1,
        boardId,
      });

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
      // Get all list documents by boardId
      const lists = await ListSchema.find({ boardId })
        .lean()
        .sort({ order: "asc" });

      const listIds = lists.map((list) => list._id);

      // Get all card documents have listId belonging to lists
      const cards = await CardSchema.find({ listId: { $in: listIds } })
        .lean()
        .sort({ order: "asc" });

      // Filter card documents with listId belonging to lists
      const listsWithCards = lists.map((list) => ({
        ...list,
        cards: cards.filter(
          (card) => card.listId.toString() === list._id.toHexString()
        ),
      }));

      return res.json(listsWithCards);
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
      // Update title of list document
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

  async updateListOrder(req: Request, res: Response) {
    const { lists } = req.body as IUpdateOrderList;

    if (!lists) {
      return responseServer.badRequest(res);
    }

    try {
      const bulkOps = lists.map(({ _id, order }) => ({
        updateOne: {
          filter: { _id: mongoose.Types.ObjectId.createFromHexString(_id) }, // Filter by _id
          update: { order }, // Set the new order
        },
      }));

      // Use bulkWrite to perform multiple update operations
      await ListSchema.bulkWrite(bulkOps);

      return responseServer.success(res);
    } catch (error) {
      console.log(error);
      return responseServer.error(res);
    }
  }

  async copyList(req: Request, res: Response) {
    const { listId, title, cards } = req.body;

    if (!listId || !title) {
      return responseServer.badRequest(res);
    }

    try {
      // Find list document by id
      const list = await ListSchema.findById(listId).lean();

      if (!list) {
        return responseServer.notFound(res, "List not found!");
      }

      let createdCards;

      // Update all order of list documents increased by 1
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

      // Create list document
      const listCreated = await ListSchema.create({
        title: `${title} - Copy`,
        order: list ? list.order + 1 : 1,
        boardId: list.boardId,
      });

      if (cards.length) {
        // Insert all card in source list to copy list
        createdCards = await CardSchema.insertMany(
          cards.map((item: any) => ({
            ...item,
            listId: listCreated._id,
          }))
        );
      }

      return responseServer.success(res, `List ${title} copied!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async deleteList(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      return responseServer.badRequest(res, "List is invalid!");
    }

    try {
      const deletedList = await ListSchema.findByIdAndDelete(id).lean();

      if (!deletedList) {
        return responseServer.notFound(res, "List not found!");
      }

      // Delete all card documents have listId belonging to deletedList
      await CardSchema.deleteMany({
        listId: {
          $in: deletedList._id,
        },
      });

      // Re-update all order of list documents
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
