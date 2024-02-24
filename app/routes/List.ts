import { Router } from "express";

import ListController from "../controllers/ListController";

const listRoutes = (router: Router) => {
  router.post("/list", ListController.createList);
  router.post("/list/copy", ListController.copyList);
  router.get("/lists/:boardId/:orgId", ListController.getLists);
  router.patch("/list/order", ListController.updateListOrder);
  router.patch("/list/:id", ListController.updateList);
  router.delete("/list/:id", ListController.deleteList);
};

export default listRoutes;
