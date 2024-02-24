import { Router } from "express";

import boardRoutes from "./Board";
import listRoutes from "./List";
import cardRoutes from "./Card";

const router = Router();

const routes = () => {
  boardRoutes(router);
  listRoutes(router);
  cardRoutes(router);
  return router;
};

export default routes;
