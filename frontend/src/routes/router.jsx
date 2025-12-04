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

const router = createBrowserRouter([
  {
    element: <DiscoverPage />,
    path: "/",
    // error:</>
  },
  {
    element: <DiscoverPage />,
    path: "/discover",
    // error:</>
  },
  {
    element: <LoginPage />,
    path: "/login",
    // error:</>
  },
  {
    element: <ProfilePage />,
    path: "/profile",
    // error:</>
  },
  {
    element: <ProfilePage />,
    path: "/dashboard",
    // error:</>
  },
  {
    element: <EmailVerification />,
    path: "/verify-email",
    // error:</>
  },
  {
    element: <ResetPasswordPage />,
    path: "/reset-password/:resetToken",
    // error:</>
  },
  // Admin routes
  {
    path: "/admin",
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
  //  {
  //     element:</>,
  //     path:"",
  //     error:</>
  // },
  //  {
  //     element:</>,
  //     path:"",
  //     error:</>
  // },
]);

export default router;
