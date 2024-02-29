import { Router, raw } from "express";
import OrgSubscriptionController from "../controllers/OrgSubscriptionController";

const orgSubscriptionRoutes = (router: Router) => {
  router.post(
    "/org-subscription",
    OrgSubscriptionController.createPaymentStripe
  );
  router.post(
    "/webhook",
    raw({ type: "application/json" }),
    OrgSubscriptionController.stripeWebhook
  );
  router.get(
    "/org-subscription/:orgId",
    OrgSubscriptionController.checkOrgSubscription
  );
};

export default orgSubscriptionRoutes;
