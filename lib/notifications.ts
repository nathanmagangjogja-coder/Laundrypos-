import { createSupabaseAdmin } from './supabase/admin';

export async function createNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
    });
    if (error) throw error;
  } catch (error) {
    console.error('[CREATE_NOTIFICATION_ERROR]:', error);
  }
}
