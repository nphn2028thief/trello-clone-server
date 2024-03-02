import { Router } from "express";

import CardController from "../controllers/CardController";

const cardRoutes = (router: Router) => {
  router.post("/card", CardController.createCard);
  router.post("/card/copy", CardController.copyCard);
  router.patch("/card/order", CardController.updateCardOrder);
  router.patch("/card/:id", CardController.updateCard);
  router.delete("/card/:id/:orgId/:userId", CardController.deleteCard);
};

export default cardRoutes;
