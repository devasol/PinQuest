import { createBrowserRouter } from "react-router-dom";

import DiscoverPage from "../pages/DiscoverPage/DiscoverPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import AdminLogin from "../pages/AdminLogin/AdminLogin";
import AdminDashboard from "../components/Admin/AdminDashboard/AdminDashboard";
import AdminDashboardPage from "../pages/AdminDashboard/AdminDashboard";
import UserManagement from "../pages/AdminDashboard/UserManagement";
import ContentManagement from "../pages/AdminDashboard/ContentManagement";
import Security from "../pages/AdminDashboard/Security";
import Analytics from "../pages/AdminDashboard/Analytics";
import AdminNotificationsRoute from "../pages/AdminDashboard/AdminNotificationsRoute";
import AdminProtectedRoute from "../components/Admin/AdminProtectedRoute";
import EmailVerification from "../components/EmailVerification";
import ResetPasswordPage from "../pages/ResetPasswordPage/ResetPasswordPage";
import TestPostWindow from "../TestPostWindow";

import ErrorPage from "../pages/ErrorPage/ErrorPage";

const router = createBrowserRouter([
  {
    element: <DiscoverPage />,
    path: "/",
    errorElement: <ErrorPage />
  },
  {
    element: <DiscoverPage />,
    path: "/discover",
    errorElement: <ErrorPage />
  },
  {
    element: <LoginPage />,
    path: "/login",
    errorElement: <ErrorPage />
  },
  {
    element: <ProfilePage />,
    path: "/profile",
    errorElement: <ErrorPage />
  },
  {
    element: <ProfilePage />,
    path: "/dashboard",
    errorElement: <ErrorPage />
  },
  {
    element: <TestPostWindow />,
    path: "/test-post-window",
    errorElement: <ErrorPage />
  },
  {
    element: <EmailVerification />,
    path: "/verify-email",
    errorElement: <ErrorPage />
  },
  // Admin routes
  {
    path: "/admin",
    errorElement: <ErrorPage />,
    children: [
      {
        path: "login",
        element: <AdminLogin />
      },
      {
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            path: "dashboard",
            element: <AdminDashboardPage />
          },
          {
            path: "analytics",
            element: <Analytics />
          },
          {
            path: "users",
            element: <UserManagement />
          },
          {
            path: "posts",
            element: <ContentManagement />
          },
          {
            path: "security",
            element: <Security />
          },
          {
            path: "notifications",
            element: <AdminNotificationsRoute />
          },
          {
            path: "settings",
            element: <div className="p-8 text-center text-gray-500">Settings page coming soon...</div>
          },
          {
            path: "",
            element: <AdminDashboardPage />
          }
        ]
      }
    ]
  },
]);

export default router;
