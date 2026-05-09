import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Prevent "new page opens at footer" by resetting scroll on navigation.
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return null;
}

