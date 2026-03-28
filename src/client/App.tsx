export default function App() {
  return (
    <div className="flex h-screen bg-white">
      <div className="w-80 border-r border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Connection</h2>
        <p className="mt-2 text-sm text-slate-500">Connection panel placeholder</p>
      </div>
      <div className="flex-1 flex flex-col">
        <h2 className="p-6 text-lg font-semibold text-slate-900 border-b border-slate-200">Chat</h2>
        <p className="p-6 text-sm text-slate-500">Chat panel placeholder</p>
      </div>
    </div>
  );
}
