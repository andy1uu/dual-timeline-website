import React from "react";
import ThemeSwitcher from "./ThemeSwitcher";

const Header = () => {
  return (
    <header className="Header flex h-16 w-full items-center justify-between bg-primary px-8">
      <h1 className="Header-title text-2xl font-semibold text-dark dark:text-light">
        Dual-Timeline
      </h1>
      <ThemeSwitcher />
    </header>
  );
};

export default Header;
