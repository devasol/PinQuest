import Header from "../../components/Landing/Header/Header";
import Categories from "../../components/Categories/Categories";
import usePageTitle from "../../services/usePageTitle";

const CategoriesPage = () => {
  usePageTitle("Categories");

  return (
    <>
      <Header />
      <Categories />
    </>
  );
};

export default CategoriesPage;