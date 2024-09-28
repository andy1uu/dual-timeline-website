import React, {Suspense} from "react";
import VideoPlayer from "@/components/VideoPlayer";

export const metadata = {
  title: "Duet",
  description:
    "This is the website for the Duet project under the EchoLab.",
};
const HomePage = () => (
    <main className="Homepage flex w-full justify-center bg-light">
      <Suspense>
      <VideoPlayer />
      </Suspense>
    </main>
  );

export default HomePage;
