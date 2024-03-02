import { Request, Response } from "express";

import responseServer from "../configs/responseServer";
import LogSchema from "../models/LogSchema";

class LogController {
  async getLogsByOrg(req: Request, res: Response) {
    const { orgId } = req.params;

    if (!orgId) {
      return responseServer.badRequest(res);
    }

    try {
      const logs = await LogSchema.find({ orgId })
        .lean()
        .sort({ createdAt: "desc" });

      return res.json(logs);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async getLogsByEntity(req: Request, res: Response) {
    const { id, orgId, type } = req.params;

    if (!id || !orgId || !type) {
      return responseServer.badRequest(res);
    }

    try {
      const logs = await LogSchema.find({
        _id: id,
        orgId,
        entity: {
          type,
        },
      })
        .lean()
        .sort({ createdAt: "desc" });

      return res.json(logs);
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new LogController();
