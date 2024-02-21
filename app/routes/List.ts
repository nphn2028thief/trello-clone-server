import { Router } from "express";

import ListController from "../controllers/ListController";

const listRoutes = (router: Router) => {
  router.post("/list", ListController.createList);
  router.get("/lists/:boardId/:orgId", ListController.getListsByBoardAndOrg);
  router.patch("/list/:id", ListController.updateList);
};

export default listRoutes;
