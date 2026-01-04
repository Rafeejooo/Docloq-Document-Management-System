import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import AOS from "aos";
import "aos/dist/aos.css";

export default function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
