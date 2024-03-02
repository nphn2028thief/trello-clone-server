import { Router } from "express";

import LogController from "../controllers/LogController";

const logRoutes = (router: Router) => {
  router.get("/logs/:id/:orgId/:type", LogController.getLogsByEntity);
  router.get("/logs/:orgId", LogController.getLogsByOrg);
};

export default logRoutes;
