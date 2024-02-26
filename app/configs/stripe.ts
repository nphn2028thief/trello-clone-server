import Stripe from "stripe";

import envConfig from "./envConfig";

export const stripe = new Stripe(envConfig.stripeApiKey, {
  apiVersion: "2023-10-16",
  typescript: true,
});
