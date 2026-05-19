import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // In a real application, this would query the database for unread notifications for the user
  return NextResponse.json({
    unreadCount: 1, // Mock value
  });
}
