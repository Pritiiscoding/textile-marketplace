import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
    <h1 className="text-3xl font-semibold text-brand-900">404</h1>
    <p className="mt-2 text-gray-600">Page not found.</p>
    <Link to="/" className="mt-6 text-brand-600 hover:underline">
      Back to home
    </Link>
  </div>
);

export default NotFoundPage;
