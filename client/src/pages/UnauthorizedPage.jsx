import { Link } from "react-router-dom";

const UnauthorizedPage = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
    <h1 className="text-3xl font-semibold text-brand-900">Access denied</h1>
    <p className="mt-2 text-gray-600">
      You don't have permission to view this page.
    </p>
    <Link to="/" className="mt-6 text-brand-600 hover:underline">
      Back to home
    </Link>
  </div>
);

export default UnauthorizedPage;
