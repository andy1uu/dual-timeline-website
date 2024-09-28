import React from "react";

const Footer = () => (
    <footer className="Footer flex h-16 w-full items-center justify-center bg-light text-lg font-medium text-dark">
      <h1>
        {new Date().getFullYear()} &copy; Andy Luu. All Rights Reserved.
      </h1>
    </footer>
  );

export default Footer;