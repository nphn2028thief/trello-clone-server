import { DAY_IN_MS } from "../constants/board";
import OrgSubscriptionSchema from "../models/OrgSubscriptionSchema";

export const checkSubscription = async (orgId: string) => {
  try {
    const orgSubscription = await OrgSubscriptionSchema.findOne({
      orgId,
    }).lean();

    if (!orgSubscription) {
      return false;
    }

    const isValid =
      orgSubscription.stripePriceId &&
      orgSubscription.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

    return !!isValid;
  } catch (error) {
    throw new Error("Oops! Something went wrong!");
  }
};
