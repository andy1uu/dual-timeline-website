import { Rubik } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";
import Footer from "../components/Footer";

const rubik = Rubik({ subsets: ["latin"], display: "swap" });

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body className={rubik.className + " bg-light"}>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
