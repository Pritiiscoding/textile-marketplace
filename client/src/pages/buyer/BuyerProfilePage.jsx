import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfileRequest } from "../../api/userApi";
import PhoneInput from "../../components/PhoneInput";

const BuyerProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const p = user?.profile || {};

  const [form, setForm] = useState({
    companyName: p.companyName || "",
    businessType: p.businessType || "",
    industry: p.industry || "",
    contactName: p.contactName || "",
    phone: p.phone || "",
    typicalOrderQuantity: p.typicalOrderQuantity || "",
    budgetMin: p.budgetRange?.min || "",
    budgetMax: p.budgetRange?.max || "",
    productCategories: (p.productCategories || []).join(", "),
    fabricTypes: (p.fabricTypes || []).join(", "),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);
    try {
      await updateProfileRequest({
        profile: {
          companyName: form.companyName,
          businessType: form.businessType,
          industry: form.industry,
          contactName: form.contactName,
          phone: form.phone,
          typicalOrderQuantity: form.typicalOrderQuantity
            ? Number(form.typicalOrderQuantity)
            : undefined,
          budgetRange: {
            min: form.budgetMin ? Number(form.budgetMin) : undefined,
            max: form.budgetMax ? Number(form.budgetMax) : undefined,
          },
          productCategories: form.productCategories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          fabricTypes: form.fabricTypes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, name, type = "text", placeholder = "" }) => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-brand-900 dark:text-white">Your Profile</h1>

      {/* Account info banner */}
      <div className="mb-5 rounded-2xl border border-brand-100 dark:border-brand-900/40 bg-brand-50 dark:bg-slate-800/60 px-4 py-3">
        <p className="text-sm text-brand-700 dark:text-brand-300">
          <strong>{user?.email}</strong>&nbsp;·&nbsp;
          <span className="text-brand-500 dark:text-brand-400">Buyer account</span>
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name" name="companyName" />
          <Field label="Business Type" name="businessType" placeholder="e.g. Retailer, Manufacturer" />
        </div>
        <Field label="Industry" name="industry" placeholder="e.g. Apparel, Home Textiles" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Name" name="contactName" />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-slate-400">Phone</label>
            <PhoneInput
              value={form.phone}
              onChange={(phone) => setForm((f) => ({ ...f, phone }))}
              className="input-field"
            />
          </div>
        </div>

        <div className="border-t border-surface-100 dark:border-slate-800 pt-4">
          <p className="mb-4 text-sm font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">Sourcing Preferences</p>

          <div className="space-y-4">
            <Field
              label="Product categories of interest (comma-separated)"
              name="productCategories"
              placeholder="e.g. Cotton Fabric, Denim, Yarn"
            />
            <Field
              label="Preferred fabric types (comma-separated)"
              name="fabricTypes"
              placeholder="e.g. Linen, Silk, Synthetic"
            />
            <Field
              label="Typical order quantity"
              name="typicalOrderQuantity"
              type="number"
              placeholder="e.g. 500"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget Min (USD)" name="budgetMin" type="number" placeholder="e.g. 1000" />
              <Field label="Budget Max (USD)" name="budgetMax" type="number" placeholder="e.g. 5000" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default BuyerProfilePage;
