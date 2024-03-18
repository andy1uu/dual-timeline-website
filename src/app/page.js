import React from "react";
import VideoPlayer from "@/components/VideoPlayer";

export const metadata = {
  title: "Dual-Timelines",
  description:
    "This is the website for the dual-timeline project under the EchoLab.",
};
const HomePage = () => {
  return (
    <main className="Homepage flex min-h-screen w-full justify-center bg-light">
      <VideoPlayer />
    </main>
  );
};

export default HomePage;
