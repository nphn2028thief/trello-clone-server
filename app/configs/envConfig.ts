import dotenv from "dotenv";

dotenv.config();

const envConfig = {
  port: process.env.PORT || "5000",
  databaseUrl: process.env.DATABASE_URL || "",
  stripeApiKey: process.env.STRIPE_API_KEY || "",
  stripeWebhookApi: process.env.STRIPE_WEBHOOK_API || "",
  clientUrl: process.env.CLIENT_URL || "",
};

export default envConfig;
