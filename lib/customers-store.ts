import { createSupabaseBrowser }
from '@/lib/supabase/client';

const supabase =
  createSupabaseBrowser();

export async function getCustomers() {

  const { data, error } =
    await supabase
      .from('customers')
      .select('*')
      .order('created_at', {
        ascending: false
      });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}