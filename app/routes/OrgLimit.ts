import { Router } from "express";

import OrgLimitController from "../controllers/OrgLimitController";

const orgLimitRoutes = (router: Router) => {
  router.get("/org-limit/:orgId", OrgLimitController.getAvailableCount);
};

export default orgLimitRoutes;
