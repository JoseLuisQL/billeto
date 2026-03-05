import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/layout/AdminShell";

export const metadata = {
    title: "Admin — Billeto",
    description: "Panel de administración de Billeto",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    let session;
    try {
        session = await auth();
    } catch {
        redirect("/login?callbackUrl=/admin");
    }

    const userId = session?.user?.id;
    if (!userId) {
        redirect("/login?callbackUrl=/admin");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true, name: true, email: true },
    });

    if (!user?.isAdmin) {
        redirect("/dashboard");
    }

    return (
        <AdminShell admin={{ name: user.name, email: user.email }}>
            {children}
        </AdminShell>
    );
}
