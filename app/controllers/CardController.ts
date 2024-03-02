import { Request, Response } from "express";
import mongoose from "mongoose";
import clerkClient from "@clerk/clerk-sdk-node";

import responseServer from "../configs/responseServer";
import ListSchema from "../models/ListSchema";
import CardSchema from "../models/CardSchema";
import LogSchema from "../models/LogSchema";
import { ACTION, ENTITY_TYPE } from "../constants/log";
import { IUpdateOrderCard } from "../types/card";

class CardController {
  async createCard(req: Request, res: Response) {
    const { title, listId, orgId, userId } = req.body;

    if (!title || !listId || !orgId || !userId) {
      return responseServer.badRequest(res);
    }

    try {
      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      const list = await ListSchema.findById(listId).lean();

      if (!list) {
        return responseServer.notFound(res, "List not found!");
      }

      const lengthOfCard = await CardSchema.find({ listId }).lean();

      const createdCard = await CardSchema.create({
        title,
        order: lengthOfCard ? lengthOfCard.length + 1 : 1,
        listId,
      });

      // Create audit logs create card
      await LogSchema.create({
        action: ACTION.CREATE,
        orgId,
        entity: {
          id: createdCard._id,
          type: ENTITY_TYPE.CARD,
          title: createdCard.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

      return responseServer.success(res, `Card "${title}" created!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async updateCardOrder(req: Request, res: Response) {
    const { sourceId, destId, cardId, sourceCards, destCards } =
      req.body as IUpdateOrderCard;

    if (!sourceId || !destId) {
      return responseServer.badRequest(res);
    }

    try {
      // Move card in the same list
      if (sourceId === destId) {
        const bulkOps = sourceCards.map(({ _id, order }) => ({
          updateOne: {
            filter: {
              _id: mongoose.Types.ObjectId.createFromHexString(_id),
            }, // Filter by _id
            update: { order },
          },
        }));

        await CardSchema.bulkWrite(bulkOps);

        return responseServer.success(res);
      } else {
        // Move card to another list
        if (!cardId) {
          return responseServer.badRequest(res, "Card is invalid!");
        }

        for (const i in destCards) {
          await CardSchema.findByIdAndUpdate(destCards[i]._id, {
            $set: { listId: destId, order: destCards[i].order },
          });
        }

        return responseServer.success(res);
      }
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async updateCard(req: Request, res: Response) {
    const { id } = req.params;
    const { title, description, userId, orgId } = req.body;

    if (!id) {
      return responseServer.badRequest(res, "Card is invalid!");
    }

    if (!userId || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      const updatedCard = await CardSchema.findByIdAndUpdate(
        id,
        {
          $set: {
            title,
            description,
          },
        },
        {
          new: true,
        }
      );

      if (!updatedCard) {
        return responseServer.notFound(res, "Card not found");
      }

      // Create audit logs update card
      await LogSchema.create({
        action: ACTION.UPDATE,
        orgId,
        entity: {
          id: updatedCard._id,
          type: ENTITY_TYPE.CARD,
          title: updatedCard.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

      return responseServer.success(res, `Card ${updatedCard.title} updated!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async copyCard(req: Request, res: Response) {
    const { listId, cardId, title, description } = req.body;

    if (!listId || !cardId || !title) {
      return responseServer.badRequest(res);
    }

    try {
      // Find card documents by id
      const card = await CardSchema.findById(cardId).lean();

      if (!card) {
        return responseServer.notFound(res, "Card not found!");
      }

      // Update all order of card documents increased by 1
      await CardSchema.updateMany(
        {
          order: {
            $gte: card.order + 1,
          },
        },
        {
          $inc: {
            order: 1,
          },
        }
      );

      // Create card document
      await CardSchema.create({
        title: `${title} - Copy`,
        order: card ? card.order + 1 : 1,
        description,
        listId,
      });

      return responseServer.success(res, `Card ${title} copied!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async deleteCard(req: Request, res: Response) {
    const { id, orgId, userId } = req.params;

    if (!id || !orgId || !userId) {
      return responseServer.badRequest(res);
    }

    try {
      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      // Find card by id and if any will be delete
      const deletedCard = await CardSchema.findByIdAndDelete(id).lean();

      if (!deletedCard) {
        return responseServer.notFound(res, "Card not found");
      }

      // Create audit logs delete card
      await LogSchema.create({
        action: ACTION.DELETE,
        orgId,
        entity: {
          id: deletedCard._id,
          type: ENTITY_TYPE.CARD,
          title: deletedCard.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

      return responseServer.success(res, `Card ${deletedCard.title} deleted!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new CardController();
