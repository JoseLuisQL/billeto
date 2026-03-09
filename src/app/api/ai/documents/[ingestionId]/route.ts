import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { readStoredAssistantDocument } from "@/lib/assistant-documents";

type Params = {
  params: Promise<{
    ingestionId: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { ingestionId } = await params;
    const access = await requireWorkspaceAccess("member");
    const stored = await readStoredAssistantDocument(ingestionId, access.workspace.id);

    if (!stored) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return new Response(stored.fileBuffer, {
      headers: {
        "Content-Type": stored.mimeType,
        "Content-Disposition": `inline; filename=\"${stored.fileName}\"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("assistant.documents.get", error);
    return NextResponse.json({ error: "document_unavailable" }, { status: 500 });
  }
}
