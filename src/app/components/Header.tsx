import React from "react";
import ThemeSwitcher from "./ThemeSwitcher";

const Header = () => {
  return (
    <header className="Header flex h-16 w-full justify-center items-center bg-light dark:bg-dark">
      <ThemeSwitcher />
    </header>
  );
};

export default Header;
