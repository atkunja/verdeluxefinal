import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
    const phone = "2062373220";
    console.log(`Checking for phone: ${phone}`);

    const users = await prisma.user.findMany({
        where: { phone: { contains: phone } }
    });
    console.log("Users found:", JSON.stringify(users, null, 2));

    const messages = await prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        take: 10
    });
    console.log("Latest 10 messages globally:", JSON.stringify(messages.map(m => ({ id: m.id, content: m.content, externalId: m.externalId, senderId: m.senderId })), null, 2));

    if (users.length > 0) {
        const userId = users[0].id;
        const msgList = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { recipientId: userId }
                ]
            },
            orderBy: { createdAt: "desc" }
        });
        console.log(`Messages found for user ${userId}:`, JSON.stringify(msgList, null, 2));
    } else {
        console.log("No users found with that phone suffix.");
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
