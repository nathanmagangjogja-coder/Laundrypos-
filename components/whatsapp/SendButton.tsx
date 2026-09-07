'use client';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { openWa } from '@/lib/utils';
export function SendButton({ phone, message, label = 'Kirim WA' }: { phone: string; message: string; label?: string }) {
  return (
    <Button variant="default" onClick={() => openWa(phone, message)}>
      <Send className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
