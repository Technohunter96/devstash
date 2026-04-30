import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password, confirmPassword } = body;

  // Ensure all required fields are present
  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Passwords must match before we do anything with them
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  // Prevent duplicate accounts
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  // Hash the password before storing — never store plaintext
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create the user record in the database
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}