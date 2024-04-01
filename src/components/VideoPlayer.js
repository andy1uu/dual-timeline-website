"use client";

import React, { useState, useRef, Fragment, useEffect } from "react";
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
import * as d3 from "d3";
import PlotFigure from "./PlotFigure";
import { videos, timelineTypes } from "./utils";

const VideoPlayer = () => {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [videoState, setVideoState] = useState({
    playing: true,
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
  const [timeline, setTimeline] = useState({
    key: "timeline1",
    label: "Timeline 1",
    value: "timeline1",
  });

  const [timelineThreeValue, setTimelineThreeValue] = useState(0);

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
    console.log(value);
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
    setVideoState({
      ...videoState,
      played: progress.playedSeconds / videoState.duration,
    });
  };

  const changeVideoHandler = (newVideo) => {
    setSelectedVideo(newVideo);
    setVideoState({
      playing: true,
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

  const densityFunctionHandler = () => {
    const eventsPerSecond = [];

    // Create the buckets
    for (let sec = 0; sec < Math.trunc(selectedVideo.duration); sec++) {
      eventsPerSecond[sec] = 0;
    }

    // Get the filtered events
    const filteredEvents = timelineEventFilterer();

    // Loop through the event start times
    for (
      let videoEventIndex = 0;
      videoEventIndex < filteredEvents.length;
      videoEventIndex++
    ) {
      let eventStartTime = Math.trunc(
        filteredEvents[videoEventIndex].currentEventStartFrameSeconds,
      );
      let eventEndTime = Math.trunc(
        filteredEvents[videoEventIndex].currentEventEndFrameSeconds,
      );
      for (
        let startSecondIndex = eventStartTime;
        startSecondIndex < eventsPerSecond.length;
        startSecondIndex++
      ) {
        eventsPerSecond[startSecondIndex]++;
      }
      for (
        let endSecondIndex = eventEndTime;
        endSecondIndex < eventsPerSecond.length;
        endSecondIndex++
      ) {
        eventsPerSecond[endSecondIndex]--;
      }
    }

    return eventsPerSecond;
  };

  const timelineEventFilterer = () => {
    const filteredEvents =
      selectedEventType.label.slice(0, 2) !== "0:"
        ? videoEvents.filter(({ currentEventName }) => {
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
    return filteredEvents;
  };

  const timelineThreeSeekMouseUpHandler = (e, value) => {
    const timelineThreeSliderValue = value;
    setTimelineThreeValue(timelineThreeSliderValue);

    const filteredEvents = timelineEventFilterer();

    //console.log(filteredEvents);

    let totalDuration = 0;

    for (
      let filteredEventIndex = 0;
      filteredEventIndex < filteredEvents.length;
      filteredEventIndex++
    ) {
      totalDuration +=
        filteredEvents[filteredEventIndex].currentEventEndFrameSeconds -
        filteredEvents[filteredEventIndex].currentEventStartFrameSeconds;
    }

    let currentEventStart = totalDuration;
    let filteredEventIndex = filteredEvents.length - 1;

    while (filteredEventIndex > 0) {
      currentEventStart -=
        filteredEvents[filteredEventIndex].currentEventEndFrameSeconds -
        filteredEvents[filteredEventIndex].currentEventStartFrameSeconds;
      if (currentEventStart < totalDuration * (timelineThreeValue / 100)) break;
      filteredEventIndex--;
    }

    console.log("Filtered Events Length: " + filteredEvents.length);
    console.log("Filtered Event Index: " + filteredEventIndex);
    console.log(
      "Current Event Start Time: " +
        filteredEvents[filteredEventIndex].currentEventStartFrameSeconds,
    );
    console.log(
      "totalDuration * (timelineThreeValue / 100): " +
        totalDuration * (timelineThreeValue / 100),
    );
    console.log("Current Event Current Time: " + currentEventStart);

    seekHandler(
      null,
      filteredEvents[filteredEventIndex].currentEventStartFrameSeconds +
        ((totalDuration * (timelineThreeValue / 100)) - currentEventStart),
    );
    seekMouseUpHandler(
      null,
      filteredEvents[filteredEventIndex].currentEventStartFrameSeconds +
        ((totalDuration * (timelineThreeValue / 100)) - currentEventStart),
    );
  };

  const timelineThreeHandler = () => {
    if (selectedEventType.label === "0: All Events") {
      return;
    } else {
      const filteredEvents = timelineEventFilterer();

      let totalDuration = 0;

      for (
        let filteredEventIndex = 0;
        filteredEventIndex < filteredEvents.length;
        filteredEventIndex++
      ) {
        totalDuration +=
          filteredEvents[filteredEventIndex].currentEventEndFrameSeconds -
          filteredEvents[filteredEventIndex].currentEventStartFrameSeconds;
        filteredEvents[filteredEventIndex] = {
          ...filteredEvents[filteredEventIndex],
          currentEventDurationSeconds:
            filteredEvents[filteredEventIndex].currentEventEndFrameSeconds -
            filteredEvents[filteredEventIndex].currentEventStartFrameSeconds,
        };
      }
      return (
        <>
          <div className="flex w-[1920px] justify-between">
            {filteredEvents.map((filteredEvent) => {
              return (
                <div
                  style={{
                    width: `${Math.trunc((filteredEvent.currentEventDurationSeconds / totalDuration) * 1920)}px`,
                  }}
                  className="h-4 rounded-lg bg-primary"></div>
              );
            })}
          </div>
          <Slider
            min={0}
            max={100}
            value={timelineThreeValue}
            onChangeCommitted={timelineThreeSeekMouseUpHandler}
            className="!text-primary"
          />
        </>
      );
    }
  };

  const timelineFiveHandler = () => {
    const filteredEvents = timelineEventFilterer();

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
            Start Time:
            {convertSecondsToTime(event.currentEventStartFrameSeconds)}
          </div>
        </button>
      );
    });
  };

  const currentEventTypeHandler = (eventType) => {
    setSelectedEventType(eventType);
  };

  const eventTypesHandler = () => {
    const eventTypes = new Set(["0: All Events"]);

    for (
      let videoEventIndex = 0;
      videoEventIndex < videoEvents.length;
      videoEventIndex++
    ) {
      eventTypes.add(videoEvents[videoEventIndex].currentEventName);
    }

    const eventTypesArray = Array.from(eventTypes);

    const eventTypeLabels = [];

    for (
      let eventTypeIndex = 0;
      eventTypeIndex < eventTypesArray.length;
      eventTypeIndex++
    ) {
      eventTypeLabels.push({ label: eventTypesArray[eventTypeIndex] });
    }

    return eventTypeLabels;
  };

  return (
    <div className="VideoPlayer flex w-full flex-col p-8">
      <ReactPlayer
        url={selectedVideo.link}
        ref={videoPlayerRef}
        playing={videoState.playing}
        controls={videoState.controls}
        muted={videoState.muted}
        width={1920}
        height={1080}
        onProgress={progressHandler}
        className="VideoPlayer-video pointer-events-none top-0 z-0 mx-auto"
      />
      <div className="VideoPlayer-timelineContainer relative mx-auto w-[1920px] bg-dark pt-[80px] text-primary">
        {(timeline.value === "timeline2" || timeline.value === "timeline3") && (
          <div className="absolute bottom-[72px]">
            <PlotFigure
              options={{
                width: 1920,
                height: 80,
                grid: true,
                axis: null,
                marks: [
                  Plot.lineY(densityFunctionHandler(), {
                    curve: "step-after",
                  }),
                ],
              }}
            />
          </div>
        )}
        {timeline.value === "timeline3" && timelineThreeHandler()}
        {timeline.value === "timeline4" && (
          <PlotFigure
            options={{
              width: 1920,
              height: 100,
              grid: true,
              axis: null,
              marks: [
                Plot.dot(videoEvents, {
                  x: "currentEventStartFrameSeconds",
                  y: "currentEventDisplacer",
                  stroke: "currentEventName",
                  channels: { eventName: "currentEventName" },
                  tip: true,
                }),
              ],
            }}
          />
        )}
        {timeline.value === "timeline5" && timelineFiveHandler()}
        <Slider
          min={0}
          max={videoState.duration}
          value={videoState.played * videoState.duration}
          onChange={seekHandler}
          onChangeCommitted={seekMouseUpHandler}
          className="!text-primary"
        />
        <div className="flex justify-between p-2 text-xl font-semibold">
          <div>
            {convertSecondsToTime(videoState.played * videoState.duration)}
          </div>
          <div className="VideoPlayer-controls mx-auto flex w-fit">
            <div
              className="VideoPlayer-rewindButton my-auto "
              onClick={rewindHandler}>
              <FaBackward size="24px" />
            </div>
            <div
              className="VideoPlayer-playPauseButtons mx-2 my-auto"
              onClick={playPauseHandler}>
              {videoState.playing ? (
                <FaPause size="24px" />
              ) : (
                <FaPlay size="24px" />
              )}
            </div>
            <div
              className="VideoPlayer-fastForwardButton my-auto"
              onClick={fastFowardHandler}>
              <FaForward size="24px" />
            </div>
            <Listbox value={selectedVideo} onChange={changeVideoHandler}>
              <div className="VideoPlayer-selector relative mx-2 w-96">
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
                                <FaCheck
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
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
            <Listbox value={timeline} onChange={setTimeline}>
              <div className="VideoPlayer-selector w-[200px]">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                  <span className="block truncate">{timeline.label}</span>
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
                  <Listbox.Options className="absolute mt-1 max-h-60 w-[200px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    {timelineTypes.map((timelineType) => (
                      <Listbox.Option
                        key={timelineType.key}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? "bg-primary text-white" : "text-gray-900"
                          }`
                        }
                        value={timelineType}>
                        {({ timeline }) => (
                          <>
                            <span
                              className={`block truncate ${
                                timeline ? "font-medium" : "font-normal"
                              }`}>
                              {timelineType.label}
                            </span>
                            {timeline ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                <FaCheck
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
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
            {(timeline.value === "timeline2" ||
              timeline.value === "timeline3" ||
              timeline.value === "timeline5") && (
              <Listbox
                value={selectedEventType}
                onChange={currentEventTypeHandler}>
                <div className="VideoPlayer-selector relative ml-2 w-[480px]">
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
                      {eventTypesHandler().map((eventType) => (
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
                                  selectedEventType
                                    ? "font-medium"
                                    : "font-normal"
                                }`}>
                                {eventType.label}
                              </span>
                              {selectedEventType ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                  <FaCheck
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
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
            )}
          </div>
          <div>{convertSecondsToTime(videoState.duration)}</div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
