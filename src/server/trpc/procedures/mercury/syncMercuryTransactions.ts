
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { mercury } from "~/server/services/mercury";

export const syncMercuryTransactions = baseProcedure.mutation(async () => {
  try {
    const accounts = await mercury.getAccounts();
    let totalSynced = 0;

    for (const account of accounts) {
      // Upsert Account
      const dbAccount = await db.mercuryAccount.upsert({
        where: { externalId: account.id },
        create: {
          externalId: account.id,
          name: account.name,
          balance: account.balance,
          status: "active",
        },
        update: {
          balance: account.balance,
          name: account.name,
        },
      });

      const transactions = await mercury.getTransactions(account.id);

      for (const tx of transactions) {
        // Upsert MercuryTransaction
        const exists = await db.mercuryTransaction.findUnique({
          where: { externalId: tx.id }
        });

        if (exists) continue; // Skip if already synced to avoid overwriting manual changes to AccountingEntry if any

        // Create MercuryTransaction
        const dbTx = await db.mercuryTransaction.create({
          data: {
            externalId: tx.id,
            accountId: dbAccount.id,
            amount: tx.amount,
            status: tx.status,
            description: tx.counterpartyName || tx.note || "Mercury Transaction",
            transactionAt: new Date(tx.postedAt || tx.createdAt),
            category: tx.amount > 0 ? "INCOME" : "EXPENSE",
          }
        });

        // Create AccountingEntry
        const amount = Math.abs(tx.amount);
        const category = tx.amount > 0 ? "INCOME" : "EXPENSE";

        const entry = await db.accountingEntry.create({
          data: {
            date: new Date(tx.postedAt || tx.createdAt),
            amount: amount,
            category: category,
            description: `${tx.counterpartyName || "Mercury"} (Sync)`,
            mercuryTransactionId: dbTx.id,
          }
        });

        // If it's an expense, record it in the Expense model too for detailed tracking
        if (category === "EXPENSE") {
          await db.expense.create({
            data: {
              date: new Date(tx.postedAt || tx.createdAt),
              amount: amount,
              category: "EXPENSE",
              description: tx.description || tx.counterpartyName || "Expense",
              vendor: tx.counterpartyName,
              accountingEntryId: entry.id,
            }
          });
        }

        totalSynced++;
      }
    }

    return { success: true, count: totalSynced };
  } catch (error) {
    console.error("Mercury Sync Error:", error);
    return { success: false, error: (error as Error).message };
  }
});
