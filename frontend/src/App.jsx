import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import "leaflet/dist/leaflet.css";

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
