import { Router } from "express";

import BoardController from "../controllers/BoardController";

const boardRoutes = (router: Router) => {
  router.post("/board", BoardController.createBoard);
  router.get("/boards/:orgId", BoardController.getBoards);
  router.get("/boards/:orgId/:boardId", BoardController.getBoardById);
  router.patch("/board/:id", BoardController.updateBoard);
  router.delete("/board/:id", BoardController.deleteBoard);
};

export default boardRoutes;
