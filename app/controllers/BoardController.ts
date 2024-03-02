import { Request, Response } from "express";
import clerkClient from "@clerk/clerk-sdk-node";

import responseServer from "../configs/responseServer";
import BoardSchema from "../models/BoardSchema";
import ListSchema from "../models/ListSchema";
import CardSchema from "../models/CardSchema";
import LogSchema from "../models/LogSchema";
import OrgLitmitSchema from "../models/OrgLitmitSchema";
import { MAX_FREE_BOARD } from "../constants/board";
import { ACTION, ENTITY_TYPE } from "../constants/log";
import { checkSubscription } from "../utils/subscription";
import { IImage } from "../types/board";

class BoardController {
  async createBoard(req: Request, res: Response) {
    const { userId, orgId, title, image } = req.body;

    if (!userId || !orgId || !title || !image) {
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

      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { id, firstName, lastName, imageUrl } = user;

      // Find orgLimit document by orgId
      const orgLimit = await OrgLitmitSchema.findOne({ orgId }).lean();

      // Check org subscription
      const isValid = await checkSubscription(orgId);

      // Increase available count
      if (orgLimit) {
        if (!isValid && orgLimit.count >= MAX_FREE_BOARD) {
          return responseServer.badRequest(
            res,
            "You have reached your limit of free boards. Please upgraded to create more!"
          );
        }

        await OrgLitmitSchema.findOneAndUpdate(
          { orgId },
          {
            $set: {
              count: orgLimit.count + 1,
            },
          },
          { new: true }
        );
      } else {
        await OrgLitmitSchema.create({
          orgId,
          count: 1,
        });
      }

      // Create board document
      const createdBoard = await BoardSchema.create({
        orgId,
        title,
        image: storageImage,
      });

      // Create audit logs create board
      await LogSchema.create({
        action: ACTION.CREATE,
        orgId,
        entity: {
          id: createdBoard._id,
          type: ENTITY_TYPE.BOARD,
          title: createdBoard.title,
        },
        user: {
          id,
          firstName,
          lastName,
          image: imageUrl,
        },
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
      // Get all board documents by orgId
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
      // Get board detail by id and orgId
      const board = await BoardSchema.findOne({
        _id: boardId,
        orgId,
      }).lean();

      if (!board) {
        return responseServer.notFound(res, "Board not found!");
      }

      return res.json(board);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async updateBoard(req: Request, res: Response) {
    const { id } = req.params;
    const { userId, title } = req.body;

    if (!id) {
      return responseServer.badRequest(res, "Board is invalid!");
    }

    if (!userId) {
      return responseServer.badRequest(res, "User is invalid!");
    }

    try {
      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      // Update title of board document by id
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

      // Create audit logs update board
      await LogSchema.create({
        action: ACTION.UPDATE,
        orgId: updatedBoard.orgId,
        entity: {
          id: updatedBoard._id,
          type: ENTITY_TYPE.BOARD,
          title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

      return responseServer.success(res, "Updated board!");
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async deleteBoard(req: Request, res: Response) {
    const { id, userId } = req.params;

    if (!id || !userId) {
      return responseServer.badRequest(res);
    }

    try {
      // Find board document by id and delete if any
      const deletedBoard = await BoardSchema.findByIdAndDelete(id).lean();

      if (!deletedBoard) {
        return responseServer.notFound(res, "Board not found!");
      }

      // Find user using clerk
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return responseServer.notFound(res, "User not found!");
      }

      const { firstName, lastName, imageUrl } = user;

      // // Find orgLimit document by orgId
      const orgLimit = await OrgLitmitSchema.findOne({
        orgId: deletedBoard.orgId,
      }).lean();

      // Check org subscription
      const isValid = await checkSubscription(deletedBoard.orgId);

      const lists = await ListSchema.find({ boardId: deletedBoard._id }).lean();

      const listIds = lists.map((list) => list._id);

      // Delete all cards have listId belonging to lists
      await CardSchema.deleteMany({
        listId: {
          $in: listIds,
        },
      });

      // Delete all lists have boardId belonging to board
      await ListSchema.deleteMany({ boardId: deletedBoard._id });

      // Decrease available count
      if (orgLimit) {
        if (!isValid) {
          await OrgLitmitSchema.findOneAndUpdate(
            { orgId: deletedBoard.orgId },
            {
              $set: {
                count: orgLimit.count > 0 ? orgLimit.count - 1 : 0,
              },
            },
            { new: true }
          );
        }
      } else {
        await OrgLitmitSchema.create({
          orgId: deletedBoard.orgId,
          count: 1,
        });
      }

      // Create audit logs delete board
      await LogSchema.create({
        action: ACTION.DELETE,
        orgId: deletedBoard.orgId,
        entity: {
          id: deletedBoard._id,
          type: ENTITY_TYPE.BOARD,
          title: deletedBoard.title,
        },
        user: {
          id: userId,
          firstName,
          lastName,
          image: imageUrl,
        },
      });

      return responseServer.success(res, "Board deleted!");
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new BoardController();
