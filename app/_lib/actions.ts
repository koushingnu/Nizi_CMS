"use server";

import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { getSupabaseAdmin } from "./supaAdmin";
import { News, NewsInsert } from "./types";

// バリデーションスキーマ
const newsSchema = z.object({
  genre: z.string().min(1, "ジャンルは必須です"),
  body_html: z.string().min(1, "本文は必須です"),
  target_site: z.enum(["LP", "HP", "BOTH"]),
  status: z.enum(["draft", "published"]),
  published_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "有効な日時を入力してください",
  }),
});

// HTMLサニタイズ関数
function sanitizeBodyHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      "*": ["class", "id"],
    },
  });
}

// 記事一覧取得（全て）
export async function getAllNews(): Promise<News[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching news:", error);
    throw new Error("記事の取得に失敗しました");
  }

  return data as News[];
}

// 記事詳細取得
export async function getNewsById(id: number): Promise<News | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching news:", error);
    return null;
  }

  return data as News;
}

// 記事作成
export async function createNews(formData: FormData) {
  try {
    const rawData = {
      genre: formData.get("genre") as string,
      body_html: formData.get("body_html") as string,
      target_site: formData.get("target_site") as string,
      status: formData.get("status") as string,
      published_at: formData.get("published_at") as string,
    };

    // バリデーション
    const validated = newsSchema.parse(rawData);

    // HTMLサニタイズ
    const sanitizedBodyHtml = sanitizeBodyHtml(validated.body_html);

    const newsData: NewsInsert = {
      genre: validated.genre,
      body_html: sanitizedBodyHtml,
      target_site: validated.target_site as "LP" | "HP" | "BOTH",
      status: validated.status as "draft" | "published",
      published_at: new Date(validated.published_at).toISOString(),
    };

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("news").insert(newsData);

    if (error) {
      console.error("Error creating news:", error);
      throw new Error("記事の作成に失敗しました");
    }

    revalidatePath("/admin");
    return { success: true, message: "記事を作成しました" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error in createNews:", error);
    return { success: false, message: "記事の作成に失敗しました" };
  }
}

// 記事更新
export async function updateNews(id: number, formData: FormData) {
  try {
    const rawData = {
      genre: formData.get("genre") as string,
      body_html: formData.get("body_html") as string,
      target_site: formData.get("target_site") as string,
      status: formData.get("status") as string,
      published_at: formData.get("published_at") as string,
    };

    // バリデーション
    const validated = newsSchema.parse(rawData);

    // HTMLサニタイズ
    const sanitizedBodyHtml = sanitizeBodyHtml(validated.body_html);

    const newsData = {
      genre: validated.genre,
      body_html: sanitizedBodyHtml,
      target_site: validated.target_site as "LP" | "HP" | "BOTH",
      status: validated.status as "draft" | "published",
      published_at: new Date(validated.published_at).toISOString(),
    };

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("news").update(newsData).eq("id", id);

    if (error) {
      console.error("Error updating news:", error);
      throw new Error("記事の更新に失敗しました");
    }

    revalidatePath("/admin");
    return { success: true, message: "記事を更新しました" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error in updateNews:", error);
    return { success: false, message: "記事の更新に失敗しました" };
  }
}

// 記事削除
export async function deleteNews(id: number) {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("news").delete().eq("id", id);

    if (error) {
      console.error("Error deleting news:", error);
      throw new Error("記事の削除に失敗しました");
    }

    revalidatePath("/admin");
    return { success: true, message: "記事を削除しました" };
  } catch (error) {
    console.error("Error in deleteNews:", error);
    return { success: false, message: "記事の削除に失敗しました" };
  }
}
