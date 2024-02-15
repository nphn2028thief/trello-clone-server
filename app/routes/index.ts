import { Router } from "express";
import boardRoutes from "./Board";

const router = Router();

const routes = () => {
  boardRoutes(router);
  return router;
};

export default routes;
