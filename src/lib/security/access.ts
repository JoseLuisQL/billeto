import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Role = "owner" | "admin" | "member";

const ROLE_RANK: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

function normalizeRole(role: string | null | undefined): Role {
  if (role === "owner" || role === "admin" || role === "member") {
    return role;
  }
  return "member";
}

export async function requireWorkspaceAccess(minRole: Role = "member") {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership || membership.workspace.deletedAt) {
    throw new Error("Sin workspace asignado");
  }

  const currentRole = normalizeRole(membership.role);
  if (ROLE_RANK[currentRole] < ROLE_RANK[minRole]) {
    throw new Error("No tenés permisos para esta acción");
  }

  return {
    userId: session.user.id,
    role: currentRole,
    workspace: membership.workspace,
  };
}
