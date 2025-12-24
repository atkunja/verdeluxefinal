import {
  Lead,
  LeadStatus,
  leadsMock,
  bookingEventsMock,
  chargesMock,
  customersMock,
  cleanersMock,
  adminsMock,
  accountsMock,
  transactionsMock,
  changeRequestsMock,
  checklistTemplatesMock,
  basePriceRulesMock,
  billingConfigMock,
  RevenueMetric,
  revenueMetricsMock,
  Transaction,
  Account,
  ChecklistTemplate,
  BasePriceRule,
  BillingConfig,
  BookingEvent,
  ChargeRow,
  Customer,
  Cleaner,
  AdminUser,
  ScheduleChangeRequest,
  PaymentOwed,
  paymentsOwedMock,
} from "~/mocks/adminPortal";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listLeads(): Promise<Lead[]> {
  await delay();
  return [...leadsMock];
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead[]> {
  await delay();
  return leadsMock.map((lead) => (lead.id === id ? { ...lead, status } : lead));
}

export async function listBookings(): Promise<BookingEvent[]> {
  await delay();
  return [...bookingEventsMock];
}

export async function listCharges(): Promise<ChargeRow[]> {
  await delay();
  return [...chargesMock];
}

export async function chargeBooking(id: string): Promise<{ id: string; status: string }> {
  await delay();
  return { id, status: "charged" };
}

export async function preChargeBooking(id: string): Promise<{ id: string; status: string }> {
  await delay();
  return { id, status: "precharged" };
}

export async function retryCharge(id: string): Promise<{ id: string; status: string }> {
  await delay();
  return { id, status: "retrying" };
}

export async function refundCharge(id: string): Promise<{ id: string; status: string }> {
  await delay();
  return { id, status: "refunded" };
}

export async function listCustomers(): Promise<Customer[]> {
  await delay();
  return [...customersMock];
}

export async function listCleaners(): Promise<Cleaner[]> {
  await delay();
  return [...cleanersMock];
}

export async function listAdmins(): Promise<AdminUser[]> {
  await delay();
  return [...adminsMock];
}

export async function listAccounts(): Promise<Account[]> {
  await delay();
  return [...accountsMock];
}

let transactionsState = [...transactionsMock];
let paymentsOwedState = [...paymentsOwedMock];

export async function listTransactions(): Promise<Transaction[]> {
  await delay();
  return [...transactionsState];
}

export async function updateTransactionStatus(id: string, status: Transaction["status"]) {
  await delay();
  transactionsState = transactionsState.map((tx) => (tx.id === id ? { ...tx, status } : tx));
  return [...transactionsState];
}

export async function updateTransactionCategory(
  id: string,
  category: string,
  subCategory?: string
) {
  await delay();
  transactionsState = transactionsState.map((tx) =>
    tx.id === id ? { ...tx, category, description: subCategory ? `${tx.description} • ${subCategory}` : tx.description } : tx
  );
  return [...transactionsState];
}

export async function listPaymentsOwed(): Promise<PaymentOwed[]> {
  await delay();
  return [...paymentsOwedState];
}

export async function updatePaymentOwedStatus(id: string, status: PaymentOwed["status"]) {
  await delay();
  paymentsOwedState = paymentsOwedState.map((p) => (p.id === id ? { ...p, status } : p));
  return [...paymentsOwedState];
}

export async function listChangeRequests(): Promise<ScheduleChangeRequest[]> {
  await delay();
  return [...changeRequestsMock];
}

export async function listRevenueMetrics(): Promise<RevenueMetric[]> {
  await delay();
  return [...revenueMetricsMock];
}

export async function listChecklistTemplates(): Promise<ChecklistTemplate[]> {
  await delay();
  return [...checklistTemplatesMock];
}

export async function listBasePriceRules(): Promise<BasePriceRule[]> {
  await delay();
  return [...basePriceRulesMock];
}

export async function getBillingConfig(): Promise<BillingConfig> {
  await delay();
  return { ...billingConfigMock };
}
