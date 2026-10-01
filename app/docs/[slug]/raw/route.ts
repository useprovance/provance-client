import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content", "docs", `${slug}.md`);
  try {
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
