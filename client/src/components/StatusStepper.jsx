const STEPS = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_dispatch", label: "Ready for Dispatch" },
  { key: "completed", label: "Completed" },
];

const StatusStepper = ({ currentStatus }) => {
  if (currentStatus === "cancelled") {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isCompletedOrder = currentStatus === "completed";
        const isComplete = isCompletedOrder || i < currentIndex;
        const isCurrent = !isCompletedOrder && i === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isComplete
                    ? "bg-emerald-500 text-white shadow-glow-sm"
                    : isCurrent
                    ? "border-2 border-brand-500 bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-glow-sm"
                    : "border-2 border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-surface-400 dark:text-slate-500"
                }`}
              >
                {isComplete ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 w-20 text-center text-xs transition-colors ${
                  isComplete
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : isCurrent
                    ? "font-bold text-brand-600 dark:text-brand-400"
                    : "text-surface-700 dark:text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 transition-colors ${
                  isComplete ? "bg-emerald-500" : "bg-surface-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusStepper;

