import { Request, Response } from "express";
import mongoose from "mongoose";

import responseServer from "../configs/responseServer";
import ListSchema from "../models/ListSchema";
import CardSchema from "../models/CardSchema";
import { IUpdateOrderCard } from "../types/card";

class CardController {
  async createCard(req: Request, res: Response) {
    const { title, listId } = req.body;

    if (!title || !listId) {
      return responseServer.badRequest(res);
    }

    try {
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

      await ListSchema.findByIdAndUpdate(
        list._id,
        {
          $push: {
            cards: createdCard._id,
          },
        },
        {
          new: true,
        }
      );

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
}

export default new CardController();
