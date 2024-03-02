import { Request, Response } from "express";
import mongoose from "mongoose";
import clerkClient from "@clerk/clerk-sdk-node";

import responseServer from "../configs/responseServer";
import ListSchema from "../models/ListSchema";
import CardSchema from "../models/CardSchema";
import LogSchema from "../models/LogSchema";
import { ACTION, ENTITY_TYPE } from "../constants/log";
import { IUpdateOrderList } from "../types/list";

class ListController {
  async createList(req: Request, res: Response) {
    const { title, boardId, orgId, userId } = req.body;

    if (!title || !boardId || !orgId || !userId) {
      return responseServer.badRequest(res);
    }

    try {
      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      // Find length of list documents by boardId
      const lengthOfList = await ListSchema.find({ boardId }).lean();

      const createdList = await ListSchema.create({
        title,
        order: lengthOfList ? lengthOfList.length + 1 : 1,
        boardId,
      });

      // Create audit logs create list
      await LogSchema.create({
        action: ACTION.CREATE,
        orgId,
        entity: {
          id: createdList._id,
          type: ENTITY_TYPE.LIST,
          title: createdList.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
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

      // Get all log documents by orgId, cardId and type is CARD
      const logs = await LogSchema.find({
        orgId,
        "entity.type": ENTITY_TYPE.CARD,
      })
        .lean()
        .sort({ createdAt: "desc" });

      // Filter card documents with listId belonging to lists
      const listsWithCards = lists.map((list) => ({
        ...list,
        cards: cards
          .filter((card) => card.listId.toString() === list._id.toHexString())
          .map((item) => ({
            ...item,
            listTitle: list.title,
            logs: logs.filter(
              (log) => log.entity.id === item._id.toHexString()
            ),
          })),
      }));

      return res.json(listsWithCards);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async updateList(req: Request, res: Response) {
    const { id } = req.params;
    const { title, orgId, userId } = req.body;

    if (!id) {
      return responseServer.badRequest(res, "List is invalid!");
    }

    if (!orgId) {
      return responseServer.badRequest(res, "Organization is invalid!");
    }

    if (!userId) {
      return responseServer.badRequest(res, "User is invalid!");
    }

    try {
      // Update title of list document
      const updatedList = await ListSchema.findByIdAndUpdate(
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

      if (!updatedList) {
        return responseServer.notFound(res, "List not found!");
      }

      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      // Create audit logs update list
      await LogSchema.create({
        action: ACTION.UPDATE,
        orgId,
        entity: {
          id: updatedList._id,
          type: ENTITY_TYPE.LIST,
          title: updatedList.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

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
    const { id, userId, orgId } = req.params;

    if (!id) {
      return responseServer.badRequest(res, "List is invalid!");
    }

    if (!userId) {
      return responseServer.badRequest(res, "User is invalid!");
    }

    if (!orgId) {
      return responseServer.badRequest(res, "Organization is invalid!");
    }

    try {
      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

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

      // Create audit logs delete list
      await LogSchema.create({
        action: ACTION.DELETE,
        orgId,
        entity: {
          id: deletedList._id,
          type: ENTITY_TYPE.LIST,
          title: deletedList.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

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
