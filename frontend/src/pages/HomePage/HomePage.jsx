import Header from "../../components/Landing/Header/Header";
import Landing from "../../components/Landing/LandingMain/Landing";
import usePageTitle from "../../services/usePageTitle";

const HomePage = () => {
  usePageTitle("Home");

  return (
    <>
      <Header />
      <Landing />
    </>
  );
};

export default HomePage;
