import React from "react";

export const metadata = {
  title: "Create Next App",
  description: "This is a base site for Andy to create his websites.",
};
const HomePage = () => {
  return (
    <main className="Homepage flex min-h-screen w-full items-center justify-center bg-light dark:bg-dark">
      <h1 className="Homepage-text text-8xl font-bold text-dark dark:text-light">
        Hello World
      </h1>
    </main>
  );
};

export default HomePage;