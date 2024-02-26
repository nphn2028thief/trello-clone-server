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

      await CardSchema.create({
        title,
        order: lengthOfCard ? lengthOfCard.length + 1 : 1,
        listId,
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
    const { title, description } = req.body;

    if (!id) {
      return responseServer.badRequest(res, "Card is invalid!");
    }

    try {
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
    const { id } = req.params;

    if (!id) {
      return responseServer.badRequest(res);
    }

    try {
      // Find card by id and if any will be delete
      const deletedCard = await CardSchema.findByIdAndDelete(id).lean();

      if (!deletedCard) {
        return responseServer.notFound(res, "Card not found");
      }

      return responseServer.success(res, `Card ${deletedCard.title} deleted!`);
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new CardController();
