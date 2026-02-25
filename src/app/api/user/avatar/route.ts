import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ avatar: null, name: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { avatar: true, image: true, name: true },
    });

    return NextResponse.json({
        avatar: user?.avatar || user?.image || null,
        name: user?.name || null,
    });
}
