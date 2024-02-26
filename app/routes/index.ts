import { Router } from "express";

import boardRoutes from "./Board";
import listRoutes from "./List";
import cardRoutes from "./Card";
import orgLimitRoutes from "./OrgLimit";
import orgSubscriptionRoutes from "./OrgSubscription";

const router = Router();

const routes = () => {
  boardRoutes(router);
  listRoutes(router);
  cardRoutes(router);
  orgLimitRoutes(router);
  orgSubscriptionRoutes(router);
  return router;
};

export default routes;
