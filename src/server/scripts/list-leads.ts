import { db } from "~/server/db";

async function main() {
    const leads = await db.lead.findMany({
        orderBy: { id: "desc" },
        take: 5,
    });
    console.log(JSON.stringify(leads, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
