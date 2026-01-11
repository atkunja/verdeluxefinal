import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

async function main() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1])
        await prisma.$connect()
        console.log('Connection successful!')
    } catch (error) {
        console.error('Connection failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
