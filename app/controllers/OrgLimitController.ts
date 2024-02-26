import { Request, Response } from "express";
import responseServer from "../configs/responseServer";
import OrgLitmitSchema from "../models/OrgLitmitSchema";

class OrgLimitController {
  async getAvailableCount(req: Request, res: Response) {
    const { orgId } = req.params;

    if (!orgId) {
      return responseServer.badRequest(res, "Organization is invalid!");
    }

    try {
      const orgLimit = await OrgLitmitSchema.findOne({ orgId }).lean();

      if (!orgLimit) {
        return res.json({
          count: 0,
        });
      }

      return res.json({
        count: orgLimit.count,
      });
    } catch (error) {
      return responseServer.error(res);
    }
  }
}

export default new OrgLimitController();
