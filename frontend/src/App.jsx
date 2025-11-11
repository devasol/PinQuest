import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import router from "./routes/router";
import "leaflet/dist/leaflet.css";

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div>
        <RouterProvider router={router} />
      </div>
    </ThemeProvider>
  );
};

export default App;
