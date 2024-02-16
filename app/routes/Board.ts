import { Router } from "express";

import BoardController from "../controllers/BoardController";

const boardRoutes = (router: Router) => {
  router.post("/board", BoardController.createBoard);
  router.get("/boards/:organizationId", BoardController.getBoardsByOrgId);
};

export default boardRoutes;
