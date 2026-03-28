import { X } from 'lucide-react';

interface JsonDrawerProps {
  open: boolean;
  request: unknown;
  response: unknown;
  onClose: () => void;
}

export default function JsonDrawer({ open, request, response, onClose }: JsonDrawerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] z-50 bg-slate-50 border-l border-slate-200 shadow-xl overflow-y-auto transition-transform duration-300 translate-x-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Raw JSON-RPC</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Request section */}
          <div>
            <h4 className="text-sm font-medium text-slate-700">Request</h4>
            <div className="bg-white rounded-lg p-4 mt-2 overflow-x-auto">
              {request != null ? (
                <pre className="font-mono text-[13px] leading-relaxed text-slate-800">
                  <code>{JSON.stringify(request, null, 2)}</code>
                </pre>
              ) : (
                <p className="text-sm text-slate-400">No data captured</p>
              )}
            </div>
          </div>

          {/* Response section */}
          <div>
            <h4 className="text-sm font-medium text-slate-700">Response</h4>
            <div className="bg-white rounded-lg p-4 mt-2 overflow-x-auto">
              {response != null ? (
                <pre className="font-mono text-[13px] leading-relaxed text-slate-800">
                  <code>{JSON.stringify(response, null, 2)}</code>
                </pre>
              ) : (
                <p className="text-sm text-slate-400">No data captured</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
