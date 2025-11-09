import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Nizi CMS</h1>
        <p className="text-lg text-gray-600 mb-8">NEWS管理システム</p>

        <div className="space-y-4">
          <Link
            href="/admin"
            className="block w-full max-w-xs mx-auto px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-md hover:shadow-lg"
          >
            管理画面へ
          </Link>

          <div className="pt-8 border-t border-gray-200 mt-8">
            <p className="text-sm text-gray-500 mb-4">システム情報</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Vercel でホスティング</p>
              <p>✓ Supabase でデータ管理</p>
              <p>✓ LP/HP からリアルタイム読み取り可能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
