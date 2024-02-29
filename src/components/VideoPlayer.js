"use client";

import React, { useState, useRef, Fragment } from "react";
import ReactPlayer from "react-player";
import { Slider } from "@mui/material";
import { Listbox, Transition } from "@headlessui/react";
import {
  FaChevronDown,
  FaCheck,
  FaPlay,
  FaPause,
  FaBackward,
  FaForward,
} from "react-icons/fa";
import { videos } from "./utils";

const VideoPlayer = () => {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [videoState, setVideoState] = useState({
    playing: false,
    muted: true,
    controls: false,
    played: 0,
    seeking: false,
    Buffer: true,
  });
  const videoPlayerRef = useRef(null);

  const playPauseHandler = () => {
    setVideoState({ ...videoState, playing: !videoState.playing });
  };

  const rewindHandler = () => {
    //Rewinds the video player reducing 10
    videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() - 10);
  };

  const fastFowardHandler = () => {
    //FastFowards the video player by adding 10
    videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() + 10);
  };

  const seekHandler = (e, value) => {
    setVideoState({ ...videoState, played: parseFloat(value) / 100 });
  };

  const seekMouseUpHandler = (e, value) => {
    setVideoState({ ...videoState, seeking: false });
    videoPlayerRef.current.seekTo(value / 100);
  };

  const changeVideoHandler = (newVideo) => {
    setSelectedVideo(newVideo);
    setVideoState({
      playing: false,
      muted: true,
      controls: false,
      played: 0,
      seeking: false,
      Buffer: true,
    });
  }

  return (
    <div className="VideoPlayer flex w-4/5 flex-col gap-8">
      <Listbox value={selectedVideo} onChange={changeVideoHandler}>
        <div className="VideoPlayer-selector relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">{selectedVideo.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <FaChevronDown
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {videos.map((video) => (
                <Listbox.Option
                  key={video.label}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                    }`
                  }
                  value={video}>
                  {({ selectedVideo }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selectedVideo ? "font-medium" : "font-normal"
                        }`}>
                        {video.label}
                      </span>
                      {selectedVideo ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <FaCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      <ReactPlayer
        url={selectedVideo.link}
        ref={videoPlayerRef}
        playing={videoState.playing}
        controls={videoState.controls}
        muted={videoState.muted}
        className="VideoPlayer-video !w-[1080px] !h-[720px] mx-auto"
      />
      <div className="VideoPlayer-controls flex justify-between">
        <div className="VideoPlayer-rewindButton" onClick={rewindHandler}>
          <FaBackward />
        </div>
        <div
          className="VideoPlayer-playPauseButtons"
          onClick={playPauseHandler}>
          {videoState.playing ? <FaPause /> : <FaPlay />}
        </div>
        <div
          className="VideoPlayer-fastForwardButton"
          onClick={fastFowardHandler}>
          <FaForward />
        </div>
      </div>
      <Slider
        min={0}
        max={100}
        value={videoState.played * 100}
        onChange={seekHandler}
        onChangeCommitted={seekMouseUpHandler}
        valueLabelDisplay="on"
      />
    </div>
  );
};

export default VideoPlayer;
