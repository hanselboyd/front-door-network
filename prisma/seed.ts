import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const shelves = [
  ["Neural Broadcast", "neural-broadcast", "Front Door's featured AI cinema transmission.", 10],
  ["Synthetic Stories", "synthetic-stories", "Narrative films created with AI-native workflows.", 20],
  ["Machine Dreams", "machine-dreams", "Surreal, experimental and visually ambitious AI cinema.", 30],
  ["First Broadcast", "first-broadcast", "Premieres and newly released films.", 40],
  ["Extended Transmission", "extended-transmission", "Long-form films, specials and extended works.", 50],
  ["The Lab", "the-lab", "Experiments, prototypes and emerging forms.", 60]
] as const;

async function main() {
  for (const [name, slug, description, sortOrder] of shelves) {
    await prisma.shelf.upsert({
      where: { slug },
      update: { name, description, sortOrder, isActive: true },
      create: { name, slug, description, sortOrder, isActive: true },
    });
  }
}

main().finally(async () => prisma.$disconnect());
