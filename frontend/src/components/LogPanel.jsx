// frontend/src/components/LogPanel.jsx
import '../components/Panel.css';

export default function LogPanel({ logs }) {
  return (
    <div className="panel-wrapper bg-[#141414] border border-[#2a2a2a] text-sm text-gray-300">
      <h2>📜 Log Panel</h2>
      <div className="overflow-auto h-[200px] border-t border-[#333] pt-2 px-1 text-xs">
        {logs.slice().reverse().map((log, idx) => (
          <div key={idx} className="mb-1">🔹 {log}</div>
        ))}
      </div>
    </div>
  );
}
