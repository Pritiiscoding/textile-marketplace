import { Link } from "react-router-dom";

const StatCard = ({ label, value, accent = false, icon, to }) => {
  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group rounded-2xl p-6 transition-all duration-300 ${
        accent
          ? "border-2 border-b-4 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 ring-1 ring-amber-100 shadow-lg active:translate-y-1 active:border-b-2 hover:-translate-y-3 hover:shadow-2xl hover:border-amber-400"
          : "border-2 border-b-4 border-surface-200 bg-gradient-to-br from-white to-surface-50 shadow-lg active:translate-y-1 active:border-b-2 hover:-translate-y-3 hover:shadow-2xl hover:border-brand-300"
      } ${to ? "cursor-pointer" : ""}`}
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
    >
      {icon && (
        <div className="mb-3 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-surface-700">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-900 tracking-tight group-hover:text-brand-600 transition-colors duration-300">{value}</p>
    </Wrapper>
  );
};

export default StatCard;
