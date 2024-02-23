import { Rubik } from "next/font/google";
import Providers from "./providers";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const rubik = Rubik({ subsets: ["latin"], display: "swap" });

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className={rubik.className}>
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
