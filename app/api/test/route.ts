import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase =
      await createSupabaseServer();

    const { data, error } =
      await supabase
        .from("customers")
        .select("*");

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
      });
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}