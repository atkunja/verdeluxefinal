import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const calculateBookingPrice = requireAdmin
  .input(
    z.object({
      serviceType: z.string(),
      houseSquareFootage: z.number().int().nonnegative().optional(),
      basementSquareFootage: z.number().int().nonnegative().optional(),
      numberOfBedrooms: z.number().int().nonnegative().optional(),
      numberOfBathrooms: z.number().int().nonnegative().optional(),
      selectedExtras: z.array(z.number()).optional(),
    })
  )
  .query(async ({ input }) => {
    const pricingRules = await db.pricingRule.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    const applyRange = (rule: any, amount: number) => {
      let result = amount;
      if (rule.priceRangeMin !== null && rule.priceRangeMin !== undefined) {
        result = Math.max(result, rule.priceRangeMin);
      }
      if (rule.priceRangeMax !== null && rule.priceRangeMax !== undefined) {
        result = Math.min(result, rule.priceRangeMax);
      }
      return result;
    };

    let totalPrice = 0;
    let totalTime = 0;
    const breakdown: Array<{ description: string; amount: number; time?: number }> = [];

    const totalSquareFootage =
      (input.houseSquareFootage || 0) + (input.basementSquareFootage || 0);

    const basePriceRule = pricingRules.find(
      (rule) =>
        rule.ruleType === "BASE_PRICE" &&
        (rule.serviceType === input.serviceType || rule.serviceType === null)
    );
    if (basePriceRule) {
      const raw = basePriceRule.priceAmount || 0;
      const price = applyRange(basePriceRule, raw);
      totalPrice += price;
      breakdown.push({
        description: `Base price for ${input.serviceType}`,
        amount: price,
      });
      if (basePriceRule.timeAmount) totalTime += basePriceRule.timeAmount;
    }

    if (totalSquareFootage > 0) {
      const sqftRule = pricingRules.find(
        (rule) =>
          rule.ruleType === "SQFT_RATE" &&
          (rule.serviceType === input.serviceType || rule.serviceType === null)
      );
      if (sqftRule?.ratePerUnit) {
        const raw = totalSquareFootage * sqftRule.ratePerUnit;
        const price = applyRange(sqftRule, raw);
        totalPrice += price;
        breakdown.push({
          description: `${totalSquareFootage} sq ft @ $${sqftRule.ratePerUnit}/sq ft`,
          amount: price,
        });
        if (sqftRule.timePerUnit) totalTime += totalSquareFootage * sqftRule.timePerUnit;
      }
    }

    if (input.numberOfBedrooms && input.numberOfBedrooms > 0) {
      const bedroomRule = pricingRules.find(
        (rule) =>
          rule.ruleType === "BEDROOM_RATE" &&
          (rule.serviceType === input.serviceType || rule.serviceType === null)
      );
      if (bedroomRule?.ratePerUnit) {
        const raw = input.numberOfBedrooms * bedroomRule.ratePerUnit;
        const price = applyRange(bedroomRule, raw);
        totalPrice += price;
        breakdown.push({
          description: `${input.numberOfBedrooms} bedroom(s) @ $${bedroomRule.ratePerUnit}/bedroom`,
          amount: price,
        });
        if (bedroomRule.timePerUnit)
          totalTime += input.numberOfBedrooms * bedroomRule.timePerUnit;
      }
    }

    if (input.numberOfBathrooms && input.numberOfBathrooms > 0) {
      const bathroomRule = pricingRules.find(
        (rule) =>
          rule.ruleType === "BATHROOM_RATE" &&
          (rule.serviceType === input.serviceType || rule.serviceType === null)
      );
      if (bathroomRule?.ratePerUnit) {
        const raw = input.numberOfBathrooms * bathroomRule.ratePerUnit;
        const price = applyRange(bathroomRule, raw);
        totalPrice += price;
        breakdown.push({
          description: `${input.numberOfBathrooms} bathroom(s) @ $${bathroomRule.ratePerUnit}/bathroom`,
          amount: price,
        });
        if (bathroomRule.timePerUnit)
          totalTime += input.numberOfBathrooms * bathroomRule.timePerUnit;
      }
    }

    if (input.selectedExtras && input.selectedExtras.length > 0) {
      for (const extraId of input.selectedExtras) {
        const extraRule = pricingRules.find(
          (rule) => rule.id === extraId && rule.ruleType === "EXTRA_SERVICE"
        );
        if (extraRule) {
          const raw = extraRule.priceAmount || 0;
          const price = applyRange(extraRule, raw);
          totalPrice += price;
          breakdown.push({
            description: extraRule.extraName || "Extra service",
            amount: price,
          });
          if (extraRule.timeAmount) totalTime += extraRule.timeAmount;
        }
      }
    }

    if (totalTime === 0) {
      const timeRule = pricingRules.find(
        (rule) =>
          rule.ruleType === "TIME_ESTIMATE" &&
          (rule.serviceType === input.serviceType || rule.serviceType === null)
      );
      if (timeRule) {
        if (timeRule.timeAmount) totalTime += timeRule.timeAmount;
        if (timeRule.timePerUnit && totalSquareFootage > 0) {
          totalTime += totalSquareFootage * timeRule.timePerUnit;
        }
      }
    }

    const finalPrice = Math.round(totalPrice * 100) / 100;
    const finalTime = Math.ceil(totalTime * 2) / 2;

    return {
      price: finalPrice,
      durationHours: finalTime > 0 ? finalTime : null,
      breakdown,
    };
  });
