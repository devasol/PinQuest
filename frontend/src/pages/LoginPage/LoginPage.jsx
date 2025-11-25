import Login from "../../components/Login/Login";
import Header from "../../components/Landing/Header/Header";
import usePageTitle from "../../services/usePageTitle";

const LoginPage = () => {
  usePageTitle("Login");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <Login />
      </div>
    </div>
  );
};

export default LoginPage;
