import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const subscriptions = [
    // Streaming
    { name: "Amazon Prime Video", icon: "🎬", color: "#00A8E1", price: 9.00, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 1 },
    { name: "Apple Music", icon: "🎵", color: "#FC3C44", price: 11.00, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 2 },
    { name: "Apple TV+", icon: "📺", color: "#555555", price: 10.00, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 3 },
    { name: "Crunchyroll", icon: "🍥", color: "#F47521", price: 7.99, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 4 },
    { name: "Disney+", icon: "🏰", color: "#113CCF", price: 14.00, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 5 },
    { name: "Max", icon: "🎥", color: "#002BE7", price: 10.00, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 6 },
    { name: "Spotify", icon: "🎧", color: "#1DB954", price: 12.00, currency: "USD", category: "Streaming", frequency: "monthly", sortOrder: 7 },

    // Productividad
    { name: "Canva", icon: "🎨", color: "#00C4CC", price: 7.00, currency: "USD", category: "Productividad", frequency: "monthly", sortOrder: 10 },
    { name: "Microsoft 365", icon: "📊", color: "#0078D4", price: 10.00, currency: "USD", category: "Productividad", frequency: "monthly", sortOrder: 11 },
    { name: "Notion", icon: "📝", color: "#000000", price: 10.00, currency: "USD", category: "Productividad", frequency: "monthly", sortOrder: 12 },

    // IA
    { name: "ChatGPT Plus", icon: "🤖", color: "#10A37F", price: 20.00, currency: "USD", category: "IA", frequency: "monthly", sortOrder: 20 },
    { name: "Claude Pro", icon: "🧠", color: "#D97706", price: 20.00, currency: "USD", category: "IA", frequency: "monthly", sortOrder: 21 },
    { name: "GitHub Copilot", icon: "🐙", color: "#6E40C9", price: 10.00, currency: "USD", category: "IA", frequency: "monthly", sortOrder: 22 },
    { name: "Cursor", icon: "⌨️", color: "#0E639C", price: 20.00, currency: "USD", category: "IA", frequency: "monthly", sortOrder: 23 },

    // Desarrollo
    { name: "Vercel", icon: "▲", color: "#000000", price: 20.00, currency: "USD", category: "Desarrollo", frequency: "monthly", sortOrder: 30 },
    { name: "Supabase", icon: "⚡", color: "#3ECF8E", price: 25.00, currency: "USD", category: "Desarrollo", frequency: "monthly", sortOrder: 31 },
    { name: "v0", icon: "🔮", color: "#000000", price: 20.00, currency: "USD", category: "Desarrollo", frequency: "monthly", sortOrder: 32 },

    // Almacenamiento
    { name: "Google One", icon: "☁️", color: "#4285F4", price: 3.00, currency: "USD", category: "Almacenamiento", frequency: "monthly", sortOrder: 40 },
    { name: "iCloud+", icon: "☁️", color: "#3693F5", price: 2.00, currency: "USD", category: "Almacenamiento", frequency: "monthly", sortOrder: 41 },

    // Internet
    { name: "Starlink", icon: "🛰️", color: "#1D1D1F", price: 120.00, currency: "USD", category: "Internet", frequency: "monthly", sortOrder: 42 },

    // Delivery
    { name: "Rappi Pro", icon: "🛵", color: "#FF441F", price: 25.00, currency: "USD", category: "Delivery", frequency: "monthly", sortOrder: 50 },
    { name: "Uber One", icon: "🚗", color: "#000000", price: 9.99, currency: "USD", category: "Delivery", frequency: "monthly", sortOrder: 51 },

    // Redes Sociales
    { name: "X", icon: "𝕏", color: "#000000", price: 8.00, currency: "USD", category: "Redes Sociales", frequency: "monthly", sortOrder: 60 },

    // Entretenimiento
    { name: "Lovable", icon: "💜", color: "#8B5CF6", price: 25.00, currency: "USD", category: "Entretenimiento", frequency: "monthly", sortOrder: 70 },

    // Finanzas
    { name: "Gasti", icon: "💰", color: "#D3FF0A", price: 5.00, currency: "USD", category: "Finanzas", frequency: "monthly", sortOrder: 80 },

    // Deportes
    { name: "Strava", icon: "🏃", color: "#FC4C02", price: 12.00, currency: "USD", category: "Deportes", frequency: "monthly", sortOrder: 90 },

    // Música
    { name: "YouTube Premium", icon: "▶️", color: "#FF0000", price: 14.00, currency: "USD", category: "Música", frequency: "monthly", sortOrder: 100 },

    // melo+
    { name: "melo+", icon: "🎵", color: "#FF1493", price: 10.00, currency: "USD", category: "Música", frequency: "monthly", sortOrder: 101 },
];

async function main() {
    console.log("Seeding popular subscriptions...");
    await prisma.popularSubscription.deleteMany();

    for (const sub of subscriptions) {
        await prisma.popularSubscription.create({ data: sub });
    }

    console.log(`Seeded ${subscriptions.length} popular subscriptions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
