export default function DashboardPage() {
  return (
    <>
      <aside className="w-60 border-r border-border p-4 shrink-0">
        <h2 className="text-base font-semibold">Sidebar</h2>
      </aside>
      <main className="flex-1 p-4 overflow-auto">
        <h2 className="text-base font-semibold">Main</h2>
      </main>
    </>
  );
}
