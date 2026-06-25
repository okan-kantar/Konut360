import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";

export async function GET() {
  try {
    await connectDB();
    const dbState = mongoose.connection.readyState === 1 ? "connected" : "not-connected";
    return NextResponse.json({ status: "ok", db: dbState });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}
