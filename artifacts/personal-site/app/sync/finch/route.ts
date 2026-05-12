import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const expected = process.env.FINCH_UPLOAD_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "Server is missing FINCH_UPLOAD_TOKEN" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  let buf: Buffer;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof Blob)) {
        return NextResponse.json(
          { error: "Missing 'file' field in form" },
          { status: 400 },
        );
      }
      buf = Buffer.from(await file.arrayBuffer());
    } else {
      const ab = await req.arrayBuffer();
      buf = Buffer.from(ab);
    }
  } catch {
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  if (buf.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  // Validate it's actually a zip with expected Finch contents
  let entryCount = 0;
  try {
    const zip = await JSZip.loadAsync(buf);
    if (!zip.file("FinchDay.json") && !zip.file("MovementSession.json")) {
      return NextResponse.json(
        { error: "Not a Finch export (missing FinchDay.json / MovementSession.json)" },
        { status: 400 },
      );
    }
    entryCount = Object.keys(zip.files).length;
  } catch {
    return NextResponse.json({ error: "Invalid ZIP archive" }, { status: 400 });
  }

  const dataDir = path.join(process.cwd(), "data");
  const targetPath = path.join(dataDir, "finch-export.zip");
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(targetPath, buf);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save file", detail: String(err) },
      { status: 500 },
    );
  }

  revalidatePath("/finch");
  revalidatePath("/diabetes");

  return NextResponse.json({
    ok: true,
    bytes: buf.length,
    entries: entryCount,
    savedTo: "data/finch-export.zip",
  });
}
