import React from "react";
import { Rubik } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import PropTypes from 'prop-types';

const rubik = Rubik({ subsets: ["latin"], display: "swap" });

const RootLayout = ({ children }) => (
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

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RootLayout;
