import { Router } from "express";

import CardController from "../controllers/CardController";

const cardRoutes = (router: Router) => {
  router.post("/card", CardController.createCard);
  router.patch("/card/order", CardController.updateCardOrder);
};

export default cardRoutes;
