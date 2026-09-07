import { createSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Catat satu baris aktivitas ke tabel activity_logs.
 * Dipanggil "fire and forget" — kegagalan logging tidak boleh menggagalkan aksi utama.
 */
export async function logActivity(params: {
  userId: string | null | undefined;
  action: string;
  tableName: string;
  recordId?: string | null;
}) {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from('activity_logs').insert({
      user_id: params.userId ?? null,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId ?? null,
    });
  } catch {
    // sengaja diabaikan — audit log tidak boleh memblokir aksi utama
  }
}
