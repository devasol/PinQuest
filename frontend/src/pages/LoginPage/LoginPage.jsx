import Login from "../../components/Login/Login";
import usePageTitle from "../../services/usePageTitle";

const LoginPage = () => {
  usePageTitle("Login");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Login />
      </div>
    </div>
  );
};

export default LoginPage;
