import { auth, signOut } from "@/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // /admin/signin は session なしでも表示されるので、ここでは session 有無で切り分ける。
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <header className="sticky top-0 z-40 bg-white border-b border-[#e8e4df]">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-[15px] font-semibold text-[#3a3632]"
            >
              C5med Beauty <span className="text-[#c8a84e]">Admin</span>
            </Link>
            <nav className="flex items-center gap-4 text-[13px] text-[#6b6560]">
              <Link href="/admin" className="hover:text-[#a88b2f]">
                店舗
              </Link>
              <Link href="/admin/courses" className="hover:text-[#a88b2f]">
                コース
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#6b6560]">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/signin" });
              }}
            >
              <button
                type="submit"
                className="text-[12px] px-3 py-1.5 border border-[#e8e4df] rounded-md hover:bg-[#faf9f7] text-[#6b6560]"
              >
                サインアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
