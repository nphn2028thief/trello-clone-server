import { Request, Response } from "express";
import Stripe from "stripe";

import responseServer from "../configs/responseServer";
import { stripe } from "../configs/stripe";
import envConfig from "../configs/envConfig";
import OrgSubscriptionSchema from "../models/OrgSubscriptionSchema";
import { checkSubscription } from "../utils/subscription";

class OrgSubscriptionController {
  async createPaymentStripe(req: Request, res: Response) {
    const { userId, userEmail, orgId } = req.body;

    let url = "";
    const settingUrl = `${envConfig.clientUrl}/organization/${orgId}`;

    if (!userId || !userEmail || !orgId) {
      return responseServer.badRequest(res);
    }

    try {
      const orgSubscription = await OrgSubscriptionSchema.findOne({
        orgId,
      }).lean();

      if (orgSubscription && orgSubscription.stripeCustomerId) {
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: orgSubscription.stripeCustomerId,
          return_url: settingUrl,
        });

        url = stripeSession.url;
      } else {
        const stripeSession = await stripe.checkout.sessions.create({
          success_url: settingUrl,
          cancel_url: settingUrl,
          payment_method_types: ["card"],
          mode: "subscription",
          billing_address_collection: "auto",
          customer_email: userEmail,
          line_items: [
            {
              price_data: {
                currency: "USD",
                product_data: {
                  name: "Taskify Preminum",
                  description: "Unlimited boards for your organization",
                },
                unit_amount: 2000,
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            orgId,
          },
        });

        url = stripeSession.url || "";
      }

      return responseServer.success(res, undefined, "url", url);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async stripeWebhook(req: Request, res: Response) {
    const payload = req.body;
    const payloadString = JSON.stringify(payload, null, 2);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: envConfig.stripeWebhookApi,
    });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payloadString,
        signature,
        envConfig.stripeWebhookApi
      );
    } catch (error) {
      return responseServer.error(res, "Webhook is error!");
    }

    const session = event.data.object as Stripe.Checkout.Session;

    try {
      if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        if (!session.metadata?.orgId) {
          return responseServer.conflict(res, "Organization is required!");
        }

        await OrgSubscriptionSchema.create({
          orgId: session.metadata?.orgId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        });
      }

      if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await OrgSubscriptionSchema.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          }
        );
      }

      return responseServer.success(res);
    } catch (error) {
      return responseServer.error(res);
    }
  }

  async checkOrgSubscription(req: Request, res: Response) {
    const { orgId } = req.params;

    if (!orgId) {
      return responseServer.badRequest(res, "Organization is invalid!");
    }

    const isValid = await checkSubscription(orgId);

    return res.json({ isValid });
  }
}

export default new OrgSubscriptionController();
