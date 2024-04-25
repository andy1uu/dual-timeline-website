import React from "react";
import VideoPlayer from "@/components/VideoPlayer";

export const metadata = {
  title: "Duet",
  description:
    "This is the website for the Duet project under the EchoLab.",
};
const HomePage = () => {
  return (
    <main className="Homepage flex w-full justify-center bg-light">
      <VideoPlayer />
    </main>
  );
};

export default HomePage;
