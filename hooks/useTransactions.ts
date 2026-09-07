'use client';
import { useState } from 'react';
import { dummyTransactions } from '@/constants/dummy';
import type { Transaction, LaundryStatus } from '@/types';

export function useTransactions() {
  const [data, setData] = useState<Transaction[]>(dummyTransactions);

  function updateStatus(id: string, status: LaundryStatus) {
    setData((prev) => prev.map((t) => (t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t)));
  }

  function add(tr: Transaction) { setData((prev) => [tr, ...prev]); }

  return { data, updateStatus, add };
}
