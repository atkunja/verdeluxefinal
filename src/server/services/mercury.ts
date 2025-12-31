
import { env } from "../env";

const BASE_URL = env.MERCURY_API_BASE || "https://api.mercury.com";

interface MercuryTransaction {
    id: string;
    amount: number;
    counterpartyName: string;
    createdAt: string;
    postedAt: string;
    status: string;
    note?: string;
    dashboardLink?: string;
}

interface MercuryAccount {
    id: string;
    name: string;
    currentBalance: number;
    availableBalance: number;
}

export const mercury = {
    async getAccounts(): Promise<MercuryAccount[]> {
        if (!env.MERCURY_API_KEY) return [];

        const response = await fetch(`${BASE_URL}/api/v1/accounts`, {
            headers: {
                Authorization: `Bearer ${env.MERCURY_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            // If 404/401, maybe log and return empty for now to avoid crashing app
            console.error("Mercury GetAccounts Error:", response.status, await response.text());
            return [];
        }

        const data = await response.json();
        console.log("[Mercury] getAccounts raw data:", JSON.stringify(data, null, 2));
        return data.accounts || [];
    },

    async getTransactions(accountId: string): Promise<MercuryTransaction[]> {
        if (!env.MERCURY_API_KEY) return [];

        const response = await fetch(`${BASE_URL}/api/v1/transactions?account_id=${accountId}`, {
            headers: {
                Authorization: `Bearer ${env.MERCURY_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error("Mercury GetTransactions Error:", response.status, await response.text());
            return [];
        }

        const data = await response.json();
        console.log("[Mercury] getTransactions raw data:", JSON.stringify(data, null, 2));
        return data.transactions || [];
    }
};
