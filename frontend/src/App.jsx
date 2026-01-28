import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import AOS from "aos";
import "aos/dist/aos.css";

export default function App() {
  useEffect(() => {
    AOS.init({
      duration: 500, // Reduced from 1000ms for snappier animations
      once: true,
      easing: "ease-out-cubic",
      disable: window.innerWidth < 768, // Disable on mobile for better performance
    });
  }, []);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
