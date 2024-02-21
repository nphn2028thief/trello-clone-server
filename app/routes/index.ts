import { Router } from "express";

import boardRoutes from "./Board";
import listRoutes from "./List";

const router = Router();

const routes = () => {
  boardRoutes(router);
  listRoutes(router);
  return router;
};

export default routes;
