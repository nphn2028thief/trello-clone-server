import { Router } from "express";
import OrgSubscriptionControllerCopy from "../controllers/OrgSubscriptionController";

const orgSubscriptionRoutes = (router: Router) => {
  router.post("/org-subscription", OrgSubscriptionControllerCopy.stripe);
  router.post("/webhook", OrgSubscriptionControllerCopy.stripeWebhook);
};

export default orgSubscriptionRoutes;
