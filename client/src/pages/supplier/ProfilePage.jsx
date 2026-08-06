import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateProfileRequest } from "../../api/userApi";
import PhoneInput from "../../components/PhoneInput";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: user?.profile?.companyName || "",
    businessType: user?.profile?.businessType || "",
    contactName: user?.profile?.contactName || "",
    phone: user?.profile?.phone || "",
    street: user?.profile?.address?.street || "",
    city: user?.profile?.address?.city || "",
    state: user?.profile?.address?.state || "",
    country: user?.profile?.address?.country || "",
    zip: user?.profile?.address?.zip || "",
    operatingHours: user?.profile?.operatingHours || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfileRequest({
        profile: {
          companyName: form.companyName,
          businessType: form.businessType,
          contactName: form.contactName,
          phone: form.phone,
          operatingHours: form.operatingHours,
          address: {
            street: form.street,
            city: form.city,
            state: form.state,
            country: form.country,
            zip: form.zip,
          },
        },
      });
      await refreshUser();
      toast.success("Profile updated successfully!");
      // Brief delay then redirect to dashboard
      setTimeout(() => navigate("/supplier"), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const field = (label, name, type = "text", placeholder = "") => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-800 dark:text-slate-300">{label}</label>
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
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white text-lg shadow-sm">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900 dark:text-white">Business Profile</h1>
            <p className="text-sm text-surface-700 dark:text-slate-400">Update your business information and contact details</p>
          </div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-surface-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-2xl font-bold text-white shadow-sm">
          {(user?.profile?.companyName || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-brand-900 dark:text-white">
            {user?.profile?.companyName || "Your Business"}
          </p>
          <p className="text-sm text-surface-700 dark:text-slate-400">{user?.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Supplier
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-surface-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-card">
        {/* Business Details */}
        <div>
          <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Business Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Business Name", "companyName", "text", "e.g. Textile Corp")}
            {field("Business Type", "businessType", "text", "e.g. Manufacturer")}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Contact Name", "contactName", "text", "Full name")}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-800 dark:text-slate-300">Phone</label>
              <PhoneInput
                value={form.phone}
                onChange={(phone) => setForm((f) => ({ ...f, phone }))}
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4">
            {field("Operating Hours", "operatingHours", "text", "e.g. Mon-Fri 9AM-6PM")}
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Address
          </h3>
          {field("Street", "street", "text", "Street address")}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("City", "city", "text", "City")}
            {field("State", "state", "text", "State / Province")}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Country", "country", "text", "Country")}
            {field("Zip / Postal Code", "zip", "text", "Postal code")}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary px-6 py-3 text-sm"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/supplier")}
            className="btn-outline px-6 py-3 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
