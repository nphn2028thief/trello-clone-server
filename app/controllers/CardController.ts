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

        console.log(destCards);

        for (const i in destCards) {
          await CardSchema.findByIdAndUpdate(destCards[i]._id, {
            $set: { listId: destId, order: destCards[i].order },
          });
        }

        // await CardSchema.updateMany(
        //   { _id: cardId },
        //   {
        //     $set: {
        //       listId: destId,
        //       order: { $in: destCardOrders },
        //     },
        //   },
        //   {
        //     new: true,
        //   }
        // );

        // const sourceBulkOps = sourceCards.map(({ _id, order, listId }) => ({
        //   updateOne: {
        //     filter: {
        //       _id: mongoose.Types.ObjectId.createFromHexString(_id),
        //     }, // Filter by _id
        //     update: { order, listId },
        //   },
        // }));

        // const destBulkOps = destCards.map(({ _id, order, listId }) => ({
        //   updateOne: {
        //     filter: {
        //       _id: mongoose.Types.ObjectId.createFromHexString(_id),
        //     }, // Filter by _id
        //     update: { order, listId },
        //   },
        // }));

        // await CardSchema.bulkWrite(sourceBulkOps);
        // await CardSchema.bulkWrite(destBulkOps);

        return responseServer.success(res);
      }
    } catch (error) {
      return responseServer.error(res);
    }

    // try {
    //   const sourceCardReverses = sourceCards.reverse();
    //   const destCardReverses = destCards.reverse();

    //   if (sourceId !== destId) {
    // const bulkOps = sourceCards.map((item) => ({
    //   updateOne: {
    //     filter: { _id: mongoose.Types.ObjectId.createFromHexString(item._id) }, // Filter by _id
    //     replacement: item
    //   },
    // }));

    //     // Use bulkWrite to perform multiple update operations
    //     await ListSchema.bulkWrite(bulkOps);
    //     // for (const i in sourceCardReverses.reverse()) {
    //     //   await ListSchema.findByIdAndUpdate(sourceId, {
    //     //     $set: {
    //     //       order: i,
    //     //     },
    //     //     $pullAll: {
    //     //       cardIds: sourceLists?.cardIds,
    //     //     },
    //     //     $push: {
    //     //       cardIds: sourceCardReverses[i]._id,
    //     //     },
    //     //   });
    //     // }

    //     // for (const i in destCardReverses.reverse()) {
    //     //   await ListSchema.findByIdAndUpdate(destId, {
    //     //     $set: {
    //     //       order: i,
    //     //     },
    //     //     $pullAll: {
    //     //       cardIds: destLists?.cardIds,
    //     //     },
    //     //     $push: {
    //     //       cardIds: sourceCardReverses[i]._id,
    //     //     },
    //     //   });
    //     // }
    //   }

    //   return res.send("Hello");
    // } catch (error) {
    //   return responseServer.error(res);
    // }

    // if (!cards) {
    //   return responseServer.badRequest(res);
    // }

    // try {
    //   // Move card in the same list
    //   if (sourceId === destId) {
    //     const bulkOps = sourceCards.map(({ _id, order }) => ({
    //       updateOne: {
    //         filter: { _id: mongoose.Types.ObjectId.createFromHexString(_id) }, // Filter by _id
    //         update: { order }, // Set the new order
    //       },
    //     }));

    //     // Use bulkWrite to perform multiple update operations
    //     await ListSchema.bulkWrite(bulkOps);

    //     return responseServer.success(res);
    //   }

    //   // Move card to another list
    //   for (const i in sourceCards.reverse()) {
    //     await ListSchema.findByIdAndUpdate(sourceId, {
    //       $set: {
    //         order: i,
    //       },
    //       $pullAll: {
    //         cardIds:
    //       }
    //     });
    //   }

    //   for (const i in sourceCards.reverse()) {
    //     await ListSchema.findByIdAndUpdate(sourceId, {
    //       $set: {
    //         order: i,
    //         cardIds: sourceCards,
    //       },
    //     });
    //   }
    // } catch (error) {
    //   return responseServer.error(res);
    // }
  }
}

export default new CardController();
