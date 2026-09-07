import { NextResponse } from 'next/server';
import { waLink } from '@/lib/utils';
export async function POST(req: Request) {
  const { phone, message } = await req.json();
  if (!message) return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 });
  return NextResponse.json({ ok: true, data: { url: waLink(phone ?? '', message) } });
}
