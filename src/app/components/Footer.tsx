import React from "react";

const Footer = () => {
  return (
    <footer className="Footer flex h-16 w-full items-center justify-center bg-light text-lg font-medium text-dark dark:bg-dark dark:text-light">
      <h1>
        {new Date().getFullYear()} &copy; Andy Luu. All Rights Reserved.
      </h1>
    </footer>
  );
};

export default Footer;
