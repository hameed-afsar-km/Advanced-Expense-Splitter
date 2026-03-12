export function Toast({ toast, onUndo }) {
  if (!toast) return null;
  
  return (
    <div className="toast-container" key={toast.id}>
      <div className="toast-content">
        <span className="font-medium">{toast.message}</span>
        {toast.canUndo && (
          <button className="btn-undo-mini" onClick={onUndo}>
            Undo
          </button>
        )}
      </div>
      <div className="toast-progress-bar"></div>
    </div>
  );
}
