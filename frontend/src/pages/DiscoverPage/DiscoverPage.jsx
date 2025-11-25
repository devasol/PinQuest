import MapView from "../../components/Discover/MapView";
import usePageTitle from "../../services/usePageTitle";

const DiscoverPage = () => {
  usePageTitle("Discover");

  return (
    <>
      <MapView />
    </>
  );
};

export default DiscoverPage;
