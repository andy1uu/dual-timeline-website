"use client";

import React, { useState, useRef, Fragment } from "react";
import ReactPlayer from "react-player";
import * as Plot from "@observablehq/plot";
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
import PlotFigure from "./PlotFigure";
import { videos, eventTypes } from "./utils";

const VideoPlayer = () => {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [videoState, setVideoState] = useState({
    playing: false,
    muted: true,
    controls: false,
    played: 0,
    seeking: false,
    Buffer: true,
    duration: videos[0].duration,
  });
  const [videoEvents, setVideoEvents] = useState(
    videos[0].events.sort(
      (a, b) =>
        parseFloat(a.currentEventStartFrameSeconds) -
        parseFloat(b.currentEventStartFrameSeconds),
    ),
  );
  const [selectedEventType, setSelectedEventType] = useState({
    label: "0: All Events",
  });
  const videoPlayerRef = useRef(null);

  const convertSecondsToTime = (sec) => {
    const dateObj = new Date(sec * 1000);
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const seconds = dateObj.getSeconds();
    const timeString =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");
    return timeString;
  };

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
    setVideoState({
      ...videoState,
      played: parseFloat(value) / videoState.duration,
    });
  };

  const seekMouseUpHandler = (e, value) => {
    setVideoState({ ...videoState, seeking: false });
    videoPlayerRef.current.seekTo(value / videoState.duration);
  };

  const progressHandler = (progress) => {
    console.log(progress);
    setVideoState({
      ...videoState,
      played: progress.playedSeconds / videoState.duration,
    });
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
      duration: newVideo.duration,
    });
    setVideoEvents(
      newVideo.events.sort(
        (a, b) =>
          parseFloat(a.currentEventStartFrameSeconds) -
          parseFloat(b.currentEventStartFrameSeconds),
      ),
    );
  };

  const timelineThreeHandler = () => {
    const filteredEvents =
      selectedEventType.label.slice(0, 2) !== "0:"
        ? videoEvents.filter(({ currentEventName }) => {
            console.log(currentEventName);
            return (
              currentEventName.slice(0, 2) ===
              selectedEventType.label.slice(0, 2)
            );
          })
        : videoEvents.sort(
            (a, b) =>
              parseFloat(a.currentEventStartFrameSeconds) -
              parseFloat(b.currentEventStartFrameSeconds),
          );

    return filteredEvents.map((event) => {
      let eventColor = "";
      if (event.currentEventName.slice(0, 2) === "1:") {
        eventColor = "bg-red-500";
      } else if (event.currentEventName.slice(0, 2) === "2:") {
        eventColor = "bg-orange-500";
      } else if (event.currentEventName.slice(0, 2) === "3:") {
        eventColor = "bg-yellow-500";
      } else if (event.currentEventName.slice(0, 2) === "4:") {
        eventColor = "bg-amber-500";
      } else if (event.currentEventName.slice(0, 2) === "5:") {
        eventColor = "bg-emerald-500";
      } else if (event.currentEventName.slice(0, 2) === "6:") {
        eventColor = "bg-teal-500";
      } else if (event.currentEventName.slice(0, 2) === "7:") {
        eventColor = "bg-blue-500";
      } else if (event.currentEventName.slice(0, 2) === "8:") {
        eventColor = "bg-indigo-500";
      } else if (event.currentEventName.slice(0, 2) === "9:") {
        eventColor = "bg-violet-500";
      } else if (event.currentEventName.slice(0, 3) === "10:") {
        eventColor = "bg-purple-500";
      } else if (event.currentEventName.slice(0, 3) === "11:") {
        eventColor = "bg-pink-500";
      } else if (event.currentEventName.slice(0, 3) === "12:") {
        eventColor = "bg-rose-500";
      }

      return (
        <button
          key={Math.random() * 10000}
          onClick={() =>
            seekMouseUpHandler(null, event.currentEventStartFrameSeconds)
          }
          className={`flex-none rounded-3xl p-4 ${eventColor}`}>
          <div>{event.currentEventName}</div>
          <div>
            Start Time:{" "}
            {convertSecondsToTime(event.currentEventStartFrameSeconds)}
          </div>
        </button>
      );
    });
  };

  const currentEventTypeHandler = (eventType) => {
    setSelectedEventType(eventType);
  };

  return (
    <div className="VideoPlayer flex min-h-screen w-4/5 flex-col gap-4">
      <Listbox value={selectedVideo} onChange={changeVideoHandler}>
        <div className="VideoPlayer-selector relative mx-auto w-[640px]">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
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
                      active ? "bg-primary text-white" : "text-gray-900"
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
        onProgress={progressHandler}
        className="VideoPlayer-video mx-auto !h-[480px] !w-[640px]"
      />
      <div className="VideoPlayer-controls mx-auto flex w-[640px] justify-between">
        <div className="VideoPlayer-rewindButton" onClick={rewindHandler}>
          <FaBackward size="24px" />
        </div>
        <div
          className="VideoPlayer-playPauseButtons"
          onClick={playPauseHandler}>
          {videoState.playing ? (
            <FaPause size="24px" />
          ) : (
            <FaPlay size="24px" />
          )}
        </div>
        <div
          className="VideoPlayer-fastForwardButton"
          onClick={fastFowardHandler}>
          <FaForward size="24px" />
        </div>
      </div>
      <div className="VideoPlayer-timeline1">
        <div>Timeline 1:</div>
        <Slider
          min={0}
          max={videoState.duration}
          value={videoState.played * videoState.duration}
          onChange={seekHandler}
          onChangeCommitted={seekMouseUpHandler}
          className="!text-primary"
        />
        <div className="flex justify-between">
          <div>
            {convertSecondsToTime(videoState.played * videoState.duration)}
          </div>
          <div>{convertSecondsToTime(videoState.duration)}</div>
        </div>
      </div>
      <div className="w-full">
        <PlotFigure
          options={{
            title: "Timeline 2",
            width: selectedVideo.duration / (selectedVideo.duration / 1000 - 1),
            height: 150,
            color: { legend: true },
            marks: [
              Plot.dot(videoEvents, {
                x: "currentEventStartFrameSeconds",
                y: "currentEventDisplacer",
                stroke: "currentEventName",
              }),
            ],
          }}
        />
      </div>
      <div className="VideoPlayer-timeline3 w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>Timeline 3:</div>
          <Listbox value={selectedEventType} onChange={currentEventTypeHandler}>
            <div className="VideoPlayer-selector relative w-[480px]">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                <span className="block truncate">
                  {selectedEventType.label}
                </span>
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
                  {eventTypes.map((eventType) => (
                    <Listbox.Option
                      key={eventType.label}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-primary text-white" : "text-gray-900"
                        }`
                      }
                      value={eventType}>
                      {({ selectedEventType }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selectedEventType ? "font-medium" : "font-normal"
                            }`}>
                            {eventType.label}
                          </span>
                          {selectedEventType ? (
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
        </div>
        <div className="VideoPlayer-timeline3 flex gap-1 overflow-auto">
          {timelineThreeHandler()}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;