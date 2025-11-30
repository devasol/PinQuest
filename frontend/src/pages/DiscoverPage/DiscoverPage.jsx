import React, { useState, useEffect } from 'react';
import MapView from '../../components/Discover/MapView';
import usePageTitle from '../../services/usePageTitle';

const DiscoverPage = () => {
  usePageTitle("Discover");

  return (
    <div className="min-h-screen bg-gray-900">
      <MapView />
    </div>
  );
};

export default DiscoverPage;