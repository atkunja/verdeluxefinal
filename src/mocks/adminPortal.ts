const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const formatISODate = (date: Date) => date.toISOString().slice(0, 10);

export type LeadStatus =
  "Incoming" |
  "No Response" |
  "Hot Leads" |
  "Pending Call Back" |
  "Offers Made" |
  "CONVERTED";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  bookingDetails: string;
}

export interface BookingEvent {
  id: string;
  customer: string;
  contact: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  provider: string;
  providerColor: string;
  location: string;
  price: number;
  paymentStatus: "paid" | "pending" | "refunded" | "declined";
  durationHours?: number;
  paymentIntentId?: string;
  cleaners?: { name: string; color: string }[];
  status?: string;
  recurrenceId?: string;
  serviceFrequency?: string;
  hasUnreadMessages?: boolean;
}

export interface ChargeRow {
  id: string;
  type: "pending" | "hold" | "declined" | "paid";
  serviceDate: string;
  serviceTime: string;
  customer: { name: string; email: string; phone: string };
  bookingId: string;
  cleaner: string;
  location: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentIntentId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
}

export interface Cleaner {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
  color: string;
}

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface Account {
  id: string;
  institution: string;
  name: string;
  last4: string;
  postedBalance: number;
  availableBalance: number;
  lastSynced: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  accountId: string;
  accountName: string;
  category: string;
  amount: number;
  status: "posted" | "pending" | "excluded";
}

export interface PaymentOwed {
  id: string;
  bookingId: string;
  cleaner: string;
  amount: number;
  paymentMethod: "ACH" | "Check" | "Cash";
  status: "owed" | "in_process" | "paid";
  serviceDate: string;
}

export interface ScheduleChangeRequest {
  id: string;
  cleaner: string;
  dateRange: string;
  details: string;
  adminNotes?: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface RevenueMetric {
  key:
  | "totalRevenue"
  | "billedRevenue"
  | "pendingPayments"
  | "recurringRevenue"
  | "monthlyRevenue"
  | "everyOtherWeekRevenue"
  | "weeklyRevenue";
  label: string;
  value: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  serviceType: "Commercial" | "Deep" | "Standard";
  items: string[];
}

export interface BasePriceRule {
  id: string;
  label: string;
  amount: number;
  condition: string;
}

export interface BillingConfig {
  paymentHoldDelayHours: number;
  notes: string[];
}

export const leadsMock: Lead[] = [
  {
    id: "L-1001",
    name: "Sam Carter",
    email: "sam.carter@example.com",
    phone: "(313) 555-9911",
    status: "Incoming",
    source: "Web",
    createdAt: formatISODate(addDays(new Date(), -1)),
    bookingDetails: "2 bed / 2 bath • Detroit",
  },
  {
    id: "L-1002",
    name: "Priya Singh",
    email: "priya.singh@example.com",
    phone: "(248) 555-2211",
    status: "Hot Leads",
    source: "Referral",
    createdAt: formatISODate(addDays(new Date(), -2)),
    bookingDetails: "3 bed • Move-out clean",
  },
  {
    id: "L-1003",
    name: "Alicia Rowe",
    email: "alicia.rowe@example.com",
    phone: "(734) 555-1999",
    status: "Pending Call Back",
    source: "Phone",
    createdAt: formatISODate(addDays(new Date(), -3)),
    bookingDetails: "Deep clean • Ann Arbor",
  },
  {
    id: "L-1004",
    name: "Diego Pérez",
    email: "diego.p@example.com",
    phone: "(586) 555-4411",
    status: "No Response",
    source: "Instagram",
    createdAt: formatISODate(addDays(new Date(), -5)),
    bookingDetails: "Loft clean • Midtown",
  },
  {
    id: "L-1005",
    name: "Naomi Fields",
    email: "naomi.f@example.com",
    phone: "(313) 555-8899",
    status: "Offers Made",
    source: "Web",
    createdAt: formatISODate(addDays(new Date(), -6)),
    bookingDetails: "4 bed • Recurring weekly",
  },
];

export const bookingEventsMock: BookingEvent[] = [
  {
    id: "B-2001",
    customer: "Sam Carter",
    contact: "(313) 555-9911",
    serviceType: "Standard Clean",
    scheduledDate: formatISODate(new Date()),
    scheduledTime: "09:00 AM",
    provider: "Lena",
    providerColor: "#6b7cff",
    location: "Detroit, MI",
    price: 160,
    paymentStatus: "pending",
    durationHours: 2,
    paymentIntentId: "pi_mock_2001",
    cleaners: [
      { name: "Lena", color: "#6366f1" },
      { name: "Mara", color: "#f59e0b" },
    ],
  },
  {
    id: "B-2002",
    customer: "Priya Singh",
    contact: "(248) 555-2211",
    serviceType: "Deep Clean",
    scheduledDate: formatISODate(addDays(new Date(), 1)),
    scheduledTime: "01:00 PM",
    provider: "Jordan",
    providerColor: "#34d399",
    location: "Royal Oak, MI",
    price: 280,
    paymentStatus: "paid",
    durationHours: 3,
    paymentIntentId: "pi_mock_2002",
    cleaners: [{ name: "Jordan", color: "#10b981" }],
  },
  {
    id: "B-2003",
    customer: "Alicia Rowe",
    contact: "(734) 555-1999",
    serviceType: "Move-out Clean",
    scheduledDate: formatISODate(addDays(new Date(), 2)),
    scheduledTime: "10:30 AM",
    provider: "Mara",
    providerColor: "#f59e0b",
    location: "Ann Arbor, MI",
    price: 320,
    paymentStatus: "pending",
    durationHours: 2.5,
    paymentIntentId: "pi_mock_2003",
    cleaners: [
      { name: "Mara", color: "#f59e0b" },
      { name: "Kai", color: "#0ea5e9" },
    ],
  },
];

export const chargesMock: ChargeRow[] = [
  {
    id: "CH-3001",
    type: "pending",
    serviceDate: formatISODate(addDays(new Date(), -1)),
    serviceTime: "2:00 PM",
    customer: { name: "Sam Carter", email: "sam.carter@example.com", phone: "(313) 555-9911" },
    bookingId: "B-2001",
    cleaner: "Lena",
    location: "Detroit, MI",
    amount: 160,
    paymentMethod: "Visa • 4242",
    status: "Ready",
    paymentIntentId: "pi_mock_charge_3001",
  },
  {
    id: "CH-3002",
    type: "hold",
    serviceDate: formatISODate(new Date()),
    serviceTime: "1:00 PM",
    customer: { name: "Priya Singh", email: "priya.singh@example.com", phone: "(248) 555-2211" },
    bookingId: "B-2002",
    cleaner: "Jordan",
    location: "Royal Oak, MI",
    amount: 200,
    paymentMethod: "Mastercard • 1881",
    status: "Holding",
    paymentIntentId: "pi_mock_charge_3002",
  },
  {
    id: "CH-3003",
    type: "declined",
    serviceDate: formatISODate(addDays(new Date(), -4)),
    serviceTime: "11:00 AM",
    customer: { name: "Diego Pérez", email: "diego.p@example.com", phone: "(586) 555-4411" },
    bookingId: "B-2004",
    cleaner: "Mara",
    location: "Detroit, MI",
    amount: 190,
    paymentMethod: "Visa • 9020",
    status: "Declined",
    paymentIntentId: "pi_mock_charge_3003",
  },
  {
    id: "CH-3004",
    type: "paid",
    serviceDate: formatISODate(addDays(new Date(), -10)),
    serviceTime: "9:30 AM",
    customer: { name: "Naomi Fields", email: "naomi.f@example.com", phone: "(313) 555-8899" },
    bookingId: "B-2005",
    cleaner: "Kai",
    location: "Ferndale, MI",
    amount: 210,
    paymentMethod: "Amex • 4433",
    status: "Paid",
    paymentIntentId: "pi_mock_charge_3004",
  },
];

export const customersMock: Customer[] = [
  { id: "CU-1", name: "Sam Carter", email: "sam.carter@example.com", phone: "(313) 555-9911", joined: "2023-08-01" },
  { id: "CU-2", name: "Priya Singh", email: "priya.singh@example.com", phone: "(248) 555-2211", joined: "2023-10-12" },
  { id: "CU-3", name: "Alicia Rowe", email: "alicia.rowe@example.com", phone: "(734) 555-1999", joined: "2024-01-05" },
];

export const cleanersMock: Cleaner[] = [
  { id: "CL-1", name: "Lena Fischer", email: "lena@example.com", phone: "(313) 555-0011", joined: "2023-04-10", color: "#6366f1" },
  { id: "CL-2", name: "Jordan Miles", email: "jordan@example.com", phone: "(248) 555-8822", joined: "2023-06-22", color: "#10b981" },
  { id: "CL-3", name: "Mara Patel", email: "mara@example.com", phone: "(734) 555-9933", joined: "2023-11-18", color: "#f59e0b" },
];

export const adminsMock: AdminUser[] = [
  { id: "AD-1", name: "Avery Moss", role: "Owner", permissions: ["billing", "payments", "operations"] },
  { id: "AD-2", name: "Dev Patel", role: "Ops Manager", permissions: ["calendar", "customers"] },
];

export const accountsMock: Account[] = [
  {
    id: "AC-1",
    institution: "Mercury",
    name: "Operating Checking",
    last4: "1101",
    postedBalance: 82350.23,
    availableBalance: 80710.85,
    lastSynced: "2024-07-12T14:00:00Z",
  },
  {
    id: "AC-2",
    institution: "Mercury",
    name: "Savings",
    last4: "7789",
    postedBalance: 30215.77,
    availableBalance: 30215.77,
    lastSynced: "2024-07-12T13:20:00Z",
  },
];

export const transactionsMock: Transaction[] = [
  {
    id: "TX-1",
    date: formatISODate(addDays(new Date(), -1)),
    description: "Stripe Payout",
    accountId: "AC-1",
    accountName: "Operating Checking",
    category: "Payout",
    amount: 4200,
    status: "posted",
  },
  {
    id: "TX-2",
    date: formatISODate(addDays(new Date(), -2)),
    description: "Supplies - CleanCo",
    accountId: "AC-1",
    accountName: "Operating Checking",
    category: "Supplies",
    amount: -320.5,
    status: "posted",
  },
  {
    id: "TX-3",
    date: formatISODate(addDays(new Date(), -1)),
    description: "Pending ACH - Rent",
    accountId: "AC-1",
    accountName: "Operating Checking",
    category: "Rent",
    amount: -2500,
    status: "pending",
  },
];

export const paymentsOwedMock: PaymentOwed[] = [
  {
    id: "PO-1",
    bookingId: "B-2001",
    cleaner: "Lena Fischer",
    amount: 120,
    paymentMethod: "ACH",
    status: "owed",
    serviceDate: formatISODate(addDays(new Date(), -1)),
  },
  {
    id: "PO-2",
    bookingId: "B-2002",
    cleaner: "Jordan Miles",
    amount: 150,
    paymentMethod: "ACH",
    status: "in_process",
    serviceDate: formatISODate(addDays(new Date(), -2)),
  },
  {
    id: "PO-3",
    bookingId: "B-2003",
    cleaner: "Mara Patel",
    amount: 140,
    paymentMethod: "Cash",
    status: "paid",
    serviceDate: formatISODate(addDays(new Date(), -3)),
  },
];

export const changeRequestsMock: ScheduleChangeRequest[] = [
  {
    id: "SCR-1",
    cleaner: "Jordan Miles",
    dateRange: "Jul 15 - Jul 17",
    details: "Swap afternoon shifts due to appointment",
    adminNotes: "Need coverage on 16th",
    status: "Pending",
  },
  {
    id: "SCR-2",
    cleaner: "Lena Fischer",
    dateRange: "Jul 18",
    details: "Start later by 2 hours",
    status: "Approved",
  },
  {
    id: "SCR-3",
    cleaner: "Mara Patel",
    dateRange: "Jul 20 - Jul 21",
    details: "Family event, request coverage",
    status: "Rejected",
  },
];

export const revenueMetricsMock: RevenueMetric[] = [
  { key: "totalRevenue", label: "Total Revenue", value: 128400 },
  { key: "billedRevenue", label: "Billed Revenue", value: 98200 },
  { key: "pendingPayments", label: "Pending Payments", value: 12400 },
  { key: "recurringRevenue", label: "Recurring Revenue", value: 44200 },
  { key: "monthlyRevenue", label: "Monthly Revenue", value: 18800 },
  { key: "everyOtherWeekRevenue", label: "Every-other-Week Revenue", value: 11200 },
  { key: "weeklyRevenue", label: "Weekly Revenue", value: 8300 },
];

export const checklistTemplatesMock: ChecklistTemplate[] = [
  {
    id: "CT-1",
    name: "Commercial Essentials",
    serviceType: "Commercial",
    items: ["Lobby wipe down", "Trash removal", "Restroom reset", "Stock supplies", "Spot mop"],
  },
  {
    id: "CT-2",
    name: "Deep Clean Deluxe",
    serviceType: "Deep",
    items: ["Baseboards", "Inside oven", "Inside fridge", "Grout scrub", "Air vents", "Detail dusting"],
  },
  {
    id: "CT-3",
    name: "Standard Touch-up",
    serviceType: "Standard",
    items: ["Vacuum carpets", "Wipe counters", "Bathroom refresh", "Change linens"],
  },
];

export const basePriceRulesMock: BasePriceRule[] = [
  { id: "BP-1", label: "Apartments under 1,000 sqft", amount: 140, condition: "< 1000 sqft" },
  { id: "BP-2", label: "Homes 1,000 - 2,000 sqft", amount: 185, condition: "1000-2000 sqft" },
  { id: "BP-3", label: "Homes 2,000 - 3,000 sqft", amount: 235, condition: "2000-3000 sqft" },
];

export const billingConfigMock: BillingConfig = {
  paymentHoldDelayHours: 24,
  notes: [
    "Holds applied to all bookings 24h before start time.",
    "Declines trigger a retry once per hour for 6 hours.",
    "Funds captured in Mercury Operating Checking.",
  ],
};

export const dashboardOverviewMock = {
  monthlyRevenue: { value: 18800, changePct: 12, previous: 16800 },
  monthlyBookings: { value: 142, changePct: -4, previous: 148 },
  revenueTrend: [13200, 14800, 15400, 16200, 17600, 18800],
  pendingCharges: chargesMock.filter((c) => c.type === "pending"),
  todaysTasks: [
    { id: "task-1", title: "Call back Priya", description: "Confirm deep clean scope", time: "10:00 AM", color: "bg-blue-100 text-blue-800" },
    { id: "task-2", title: "Provider check-in", description: "Mara status update", time: "1:30 PM", color: "bg-green-100 text-green-800" },
    { id: "task-3", title: "Review declined charge", description: "Retry Diego's payment", time: "3:15 PM", color: "bg-amber-100 text-amber-800" },
  ],
  upcomingJobs: bookingEventsMock,
};

export const mockCategories = ["Payout", "Supplies", "Rent", "Utilities", "Equipment", "Misc"];
