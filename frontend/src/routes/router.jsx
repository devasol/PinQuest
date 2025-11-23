import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage/HomePage";
import DiscoverPage from "../pages/DiscoverPage/DiscoverPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import CategoriesPage from "../pages/CategoriesPage/CategoriesPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import AddPost from "../pages/AddPost/AddPost";
import AdminLogin from "../pages/AdminLogin/AdminLogin";
import AdminDashboard from "../components/Admin/AdminDashboard/AdminDashboard";
import AdminDashboardPage from "../pages/AdminDashboard/AdminDashboard";
import UserManagement from "../pages/AdminDashboard/UserManagement";
import ContentManagement from "../pages/AdminDashboard/ContentManagement";
import Security from "../pages/AdminDashboard/Security";
import Analytics from "../pages/AdminDashboard/Analytics";
import AdminProtectedRoute from "../components/Admin/AdminProtectedRoute";

const router = createBrowserRouter([
  {
    element: <HomePage />,
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
    element: <CategoriesPage />,
    path: "/categories",
    // error:</>
  },
  {
    element: <AddPost />,
    path: "/add-post",
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
            path: "posts",
            element: <ContentManagement />
          },
          {
            path: "security",
            element: <Security />
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
