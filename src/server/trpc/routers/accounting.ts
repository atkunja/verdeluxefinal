import { createTRPCRouter } from "~/server/trpc/main";
import { createAccountingEntry } from "../procedures/accounting/createAccountingEntry";
import { getAccountingEntries } from "../procedures/accounting/getAccountingEntries";
import { updateAccountingEntry } from "../procedures/accounting/updateAccountingEntry";
import { deleteAccountingEntry } from "../procedures/accounting/deleteAccountingEntry";
import { syncMercuryTransactions } from "../procedures/mercury/syncMercuryTransactions";
import { listAccounts } from "../procedures/mercury/listAccounts";
import { listTransactions } from "../procedures/mercury/listTransactions";
import { getProfitAndLoss } from "../procedures/accounting/getProfitAndLoss";
import { getRevenueMetrics } from "../procedures/accounting/getRevenueMetrics";

export const accountingRouter = createTRPCRouter({
  createAccountingEntry,
  getAccountingEntries,
  updateAccountingEntry,
  deleteAccountingEntry,
  syncMercuryTransactions,
  listAccounts,
  listTransactions,
  getProfitAndLoss,
  getRevenueMetrics,
});
