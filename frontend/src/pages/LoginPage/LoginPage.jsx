import Login from "../../components/Login/Login";
import Header from "../../components/Landing/Header/Header";

const LoginPage = () => {
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
