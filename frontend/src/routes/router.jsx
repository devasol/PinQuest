import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage/HomePage";
import DiscoverPage from "../pages/DiscoverPage/DiscoverPage";
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
