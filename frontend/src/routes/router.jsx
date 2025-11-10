import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage/HomePage";
import DiscoverPage from "../pages/DiscoverPage/DiscoverPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import CategoriesPage from "../pages/CategoriesPage/CategoriesPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";

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
