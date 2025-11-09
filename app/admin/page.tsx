"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
} from "@/app/_lib/actions";
import { News } from "@/app/_lib/types";

export default function AdminPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // フォーム状態
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    body_html: "",
    target_site: "BOTH" as "LP" | "HP" | "BOTH",
    status: "draft" as "draft" | "published",
    published_at: new Date().toISOString().slice(0, 16),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 記事一覧取得
  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      setLoading(true);
      const data = await getAllNews();
      setNewsList(data);
      setError(null);
    } catch (err) {
      setError("記事の読み込みに失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // フォームリセット
  function resetForm() {
    setFormData({
      title: "",
      body_html: "",
      target_site: "BOTH",
      status: "draft",
      published_at: new Date().toISOString().slice(0, 16),
    });
    setIsEditing(false);
    setEditingId(null);
    setFormError(null);
    setSuccessMessage(null);
  }

  // 編集モード開始
  function startEdit(news: News) {
    setFormData({
      title: news.title,
      body_html: news.body_html,
      target_site: news.target_site,
      status: news.status,
      published_at: new Date(news.published_at).toISOString().slice(0, 16),
    });
    setIsEditing(true);
    setEditingId(news.id);
    setFormError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 送信処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("body_html", formData.body_html);
    data.append("target_site", formData.target_site);
    data.append("status", formData.status);
    data.append("published_at", new Date(formData.published_at).toISOString());

    startTransition(async () => {
      try {
        const result =
          isEditing && editingId
            ? await updateNews(editingId, data)
            : await createNews(data);

        if (result.success) {
          setSuccessMessage(result.message);
          resetForm();
          await loadNews();
        } else {
          setFormError(result.message);
        }
      } catch (err) {
        setFormError("エラーが発生しました");
        console.error(err);
      }
    });
  }

  // 削除処理
  async function handleDelete(id: number, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteNews(id);
        if (result.success) {
          setSuccessMessage(result.message);
          await loadNews();
        } else {
          setFormError(result.message);
        }
      } catch (err) {
        setFormError("削除に失敗しました");
        console.error(err);
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">NEWS 管理画面</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* 作成/編集フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {isEditing ? "記事編集" : "新規作成"}
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                本文 (HTML) *
              </label>
              <textarea
                value={formData.body_html}
                onChange={(e) =>
                  setFormData({ ...formData, body_html: e.target.value })
                }
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  対象サイト
                </label>
                <select
                  value={formData.target_site}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_site: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LP">LP</option>
                  <option value="HP">HP</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">下書き</option>
                  <option value="published">公開</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公開日時 *
                </label>
                <input
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(e) =>
                    setFormData({ ...formData, published_at: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isPending ? "処理中..." : isEditing ? "更新" : "作成"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium"
                >
                  キャンセル
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 記事一覧 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">記事一覧</h2>
          </div>

          {newsList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              記事がありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タイトル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      対象サイト
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      公開日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {newsList.map((news) => (
                    <tr key={news.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {news.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {news.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            news.target_site === "LP"
                              ? "bg-blue-100 text-blue-800"
                              : news.target_site === "HP"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {news.target_site}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            news.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {news.status === "published" ? "公開" : "下書き"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(news.published_at).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => startEdit(news)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(news.id, news.title)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
