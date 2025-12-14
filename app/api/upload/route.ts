import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temporary directory
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `upload-${Date.now()}.pdf`);

    await writeFile(filePath, buffer);

    return NextResponse.json({ path: filePath });
}
