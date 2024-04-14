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
import { videos } from "@/utils/videodata";
import { timelineTypes } from "@/utils/TimelineTypes";

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

  const [highlightGraph, setHighlightGraph] = useState(false);
  const [highlightGraphBlock, setHighlightGraphBlock] = useState({});

  const videoPlayerRef = useRef(null);

  const timelineThreeMax = 1000;

  const convertSecondsToTime = (sec) => {
    const dateObj = new Date(sec * 1000);
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const seconds = dateObj.getSeconds();
    const timeString =
      (hours != 0 ? hours.toString().padStart(2, "0") + ":" : "") +
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
    if (timeline.value === "timeline3" || timeline.value === "timeline4") {
      const eventBlocks = eventBlocksHandler();

      let currentEventBlocks = eventBlocks.filter((eventBlock) => {
        return eventBlock.eventBlockEndSeconds <= value;
      });

      if (currentEventBlocks.length === eventBlocks.length) {
        setTimelineThreeValue(timelineThreeMax);
      } else {
        const totalDuration = timelineThreeTotalDurationHandler();
        let currentDuration = 0;

        for (
          let filteredEventBlockIndex = 0;
          filteredEventBlockIndex < currentEventBlocks.length;
          filteredEventBlockIndex++
        ) {
          currentDuration +=
            eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
        }

        setTimelineThreeValue(
          timelineThreeMax * (currentDuration / totalDuration),
        );
      }
    }

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
    setTimeline({
      key: "timeline1",
      label: "Timeline 1",
      value: "timeline1",
    });
    setSelectedEventType({
      label: "0: All Events",
    });
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

  const densityFunctionHandler = () => {
    const eventsPerSecond = new Array(Math.ceil(selectedVideo.duration)).fill(
      0,
    );

    // Get the filtered events
    const filteredEvents = timelineEventFilterer();

    // Loop through the event start times
    for (
      let videoEventIndex = 0;
      videoEventIndex < filteredEvents.length;
      videoEventIndex++
    ) {
      let eventStartTime = Math.floor(
        filteredEvents[videoEventIndex].currentEventStartFrameSeconds,
      );
      let eventEndTime = Math.ceil(
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

  const highlightDensityFunctionHandler = () => {
    const highlightedDensityFunctionValues = new Array(
      Math.ceil(selectedVideo.duration),
    ).fill(0);

    if (highlightGraphBlock) {
      for (
        let indexToHighlight = highlightGraphBlock.eventBlockStartSeconds;
        indexToHighlight < highlightGraphBlock.eventBlockEndSeconds;
        indexToHighlight++
      ) {
        highlightedDensityFunctionValues[indexToHighlight] =
          highlightGraphBlock.eventBlockDensityValues[
            indexToHighlight - highlightGraphBlock.eventBlockStartSeconds
          ];
      }
    }

    return highlightedDensityFunctionValues;
  };

  const eventBlocksHandler = () => {
    const filteredEvents = timelineEventFilterer();
    const densityFunctionValues = densityFunctionHandler();

    const eventBlocks = [];
    let startSecondIndex = null;
    let eventBlockIndex = 0;

    for (
      let secondIndex = 0;
      secondIndex < densityFunctionValues.length;
      secondIndex++
    ) {
      if (densityFunctionValues[secondIndex] !== 0) {
        if (startSecondIndex === null) {
          startSecondIndex = secondIndex;
        }
      } else {
        if (startSecondIndex !== null) {
          eventBlocks.push({
            eventBlockIndex: eventBlockIndex,
            eventBlockStartSeconds: startSecondIndex,
            eventBlockEndSeconds: secondIndex - 1,
            eventBlockDurationSeconds: secondIndex - 1 - startSecondIndex,
            eventBlockEventType: selectedEventType.label,
            eventBlockDensityValues: densityFunctionValues.slice(
              startSecondIndex,
              secondIndex - 1,
            ),
            eventBlockEvents: filteredEvents
              .filter((filteredEvent) => {
                return (
                  startSecondIndex - 1 <
                    Math.ceil(filteredEvent.currentEventStartFrameSeconds) &&
                  secondIndex >=
                    Math.floor(filteredEvent.currentEventEndFrameSeconds)
                );
              })
              .sort(
                (a, b) =>
                  parseFloat(a.currentEventStartFrameSeconds) -
                  parseFloat(b.currentEventStartFrameSeconds),
              ),
          });
          startSecondIndex = null;
          eventBlockIndex++;
        }
      }
    }

    // Handle the case where the last section is non-zero
    if (startSecondIndex !== null) {
      eventBlocks.push({
        eventBlockIndex: eventBlockIndex,
        eventBlockStartSeconds: startSecondIndex,
        eventBlockEndSeconds: densityFunctionValues.length - 1,
        eventBlockDurationSeconds:
          densityFunctionValues.length - 1 - startSecondIndex,
        eventBlockEventType: selectedEventType.label,
        eventBlockDensityValues: densityFunctionValues.slice(
          startSecondIndex,
          densityFunctionValues.length - 1,
        ),
        eventBlockEvents: filteredEvents
          .filter((filteredEvent) => {
            return (
              startSecondIndex - 1 <
                Math.ceil(filteredEvent.currentEventStartFrameSeconds) &&
              densityFunctionValues.length >=
                Math.floor(filteredEvent.currentEventEndFrameSeconds)
            );
          })
          .sort(
            (a, b) =>
              parseFloat(a.currentEventStartFrameSeconds) -
              parseFloat(b.currentEventStartFrameSeconds),
          ),
      });
    }
    //console.log(eventBlocks);
    return eventBlocks;
  };

  const timelineThreeTotalDurationHandler = () => {
    const eventBlocks = eventBlocksHandler();

    let totalDuration = 0;

    for (
      let filteredEventBlockIndex = 0;
      filteredEventBlockIndex < eventBlocks.length;
      filteredEventBlockIndex++
    ) {
      totalDuration +=
        eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
    }

    return totalDuration;
  };

  const timelineThreeSeekHandler = (e, value) => {
    const eventBlocks = eventBlocksHandler();

    const totalDuration = timelineThreeTotalDurationHandler();

    let currentEventBlockStart = totalDuration;
    let filteredEventBlockIndex = eventBlocks.length - 1;

    while (filteredEventBlockIndex >= 0) {
      currentEventBlockStart -=
        eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
      if (currentEventBlockStart < totalDuration * (value / timelineThreeMax))
        break;
      filteredEventBlockIndex--;
    }

    seekHandler(
      null,
      eventBlocks[filteredEventBlockIndex].eventBlockStartSeconds +
        (totalDuration * (value / timelineThreeMax) - currentEventBlockStart),
    );

    setTimelineThreeValue(value);
  };

  const timelineThreeSeekMouseUpHandler = (e, value) => {
    setTimelineThreeValue(value);

    const eventBlocks = eventBlocksHandler();

    const totalDuration = timelineThreeTotalDurationHandler();

    let currentEventBlockStart = totalDuration;
    let filteredEventBlockIndex = eventBlocks.length - 1;

    while (filteredEventBlockIndex >= 0) {
      currentEventBlockStart -=
        eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
      if (currentEventBlockStart < totalDuration * (value / timelineThreeMax))
        break;
      filteredEventBlockIndex--;
    }

    seekMouseUpHandler(
      null,
      eventBlocks[filteredEventBlockIndex].eventBlockStartSeconds +
        (totalDuration * (value / timelineThreeMax) - currentEventBlockStart),
    );
  };

  useEffect(() => {
    if (timeline.value === "timeline3" || timeline.value === "timeline4") {
      const eventBlocks = eventBlocksHandler();

      let currentTime = videoState.played * videoState.duration;

      // Check if current time is in a time block

      let currentEventBlock = eventBlocks.find((eventBlock) => {
        return (
          eventBlock.eventBlockEndSeconds >= currentTime &&
          eventBlock.eventBlockStartSeconds <= currentTime
        );
      });
      if (currentEventBlock) {
        const totalDuration = timelineThreeTotalDurationHandler();
        let currentDuration = 0;

        for (
          let filteredEventBlockIndex = 0;
          filteredEventBlockIndex < currentEventBlock.eventBlockIndex;
          filteredEventBlockIndex++
        ) {
          currentDuration +=
            eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
        }

        currentDuration +=
          currentTime - currentEventBlock.eventBlockStartSeconds;

        setTimelineThreeValue(
          timelineThreeMax * (currentDuration / totalDuration),
        );
        return;
      } else {
        let currentEventBlocks = eventBlocks.filter((eventBlock) => {
          return eventBlock.eventBlockEndSeconds <= currentTime;
        });

        if (currentEventBlocks.length === eventBlocks.length) {
          setTimelineThreeValue(timelineThreeMax);
        } else {
          const totalDuration = timelineThreeTotalDurationHandler();
          let currentDuration = 0;

          for (
            let filteredEventBlockIndex = 0;
            filteredEventBlockIndex < currentEventBlocks.length;
            filteredEventBlockIndex++
          ) {
            currentDuration +=
              eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
          }

          setTimelineThreeValue(
            timelineThreeMax * (currentDuration / totalDuration),
          );
        }
      }
    }
  }, [videoState]);

  const timelineThreeHandler = () => {
    if (selectedEventType.label === "0: All Events") {
      return;
    } else {
      const eventBlocks = eventBlocksHandler();

      const filteredEventBlockType =
        eventBlocks[0].eventBlockEventType.split(":")[0];

      let eventColor = "";
      if (filteredEventBlockType === "1") {
        eventColor = "bg-red-200";
      } else if (filteredEventBlockType === "2") {
        eventColor = "bg-orange-200";
      } else if (filteredEventBlockType === "3") {
        eventColor = "bg-yellow-200";
      } else if (filteredEventBlockType === "4") {
        eventColor = "bg-amber-200";
      } else if (filteredEventBlockType === "5") {
        eventColor = "bg-emerald-200";
      } else if (filteredEventBlockType === "6") {
        eventColor = "bg-teal-200";
      } else if (filteredEventBlockType === "7") {
        eventColor = "bg-blue-200";
      } else if (filteredEventBlockType === "8") {
        eventColor = "bg-indigo-200";
      } else if (filteredEventBlockType === "9") {
        eventColor = "bg-violet-200";
      } else if (filteredEventBlockType === "10") {
        eventColor = "bg-purple-200";
      } else if (filteredEventBlockType === "11") {
        eventColor = "bg-pink-200";
      } else if (filteredEventBlockType === "12") {
        eventColor = "bg-rose-200";
      } else {
        eventColor = "bg-zinc-200";
      }

      let totalDuration = 0;

      for (
        let filteredEventBlockIndex = 0;
        filteredEventBlockIndex < eventBlocks.length;
        filteredEventBlockIndex++
      ) {
        totalDuration +=
          eventBlocks[filteredEventBlockIndex].eventBlockEndSeconds -
          eventBlocks[filteredEventBlockIndex].eventBlockStartSeconds;
      }

      return (
        <div className="!text-black">
          <div className=" flex w-[1920px] justify-between">
            {eventBlocks.map((eventBlock) => {
              return (
                <div
                  style={{
                    width: `${Math.trunc((eventBlock.eventBlockDurationSeconds / totalDuration) * 1920)}px`,
                  }}
                  onMouseEnter={() => {
                    setHighlightGraph(true);
                    setHighlightGraphBlock(eventBlock);
                  }}
                  onMouseLeave={() => {
                    setHighlightGraph(false);
                    setHighlightGraphBlock({});
                  }}
                  className={`h-16 rounded-lg opacity-75 ${eventColor} group relative mr-[2px] flex`}>
                  <div className="absolute bottom-10 z-10 hidden w-fit flex-col rounded-md bg-white group-hover:flex">
                    {eventBlock.eventBlockEvents.map((eventBlockEvent) => {
                      const filteredEventBlockType =
                        eventBlockEvent.currentEventName.split(":")[0];

                      let eventColor = "";
                      if (filteredEventBlockType === "1") {
                        eventColor = "bg-red-200";
                      } else if (filteredEventBlockType === "2") {
                        eventColor = "bg-orange-200";
                      } else if (filteredEventBlockType === "3") {
                        eventColor = "bg-yellow-200";
                      } else if (filteredEventBlockType === "4") {
                        eventColor = "bg-amber-200";
                      } else if (filteredEventBlockType === "5") {
                        eventColor = "bg-emerald-200";
                      } else if (filteredEventBlockType === "6") {
                        eventColor = "bg-teal-200";
                      } else if (filteredEventBlockType === "7") {
                        eventColor = "bg-blue-200";
                      } else if (filteredEventBlockType === "8") {
                        eventColor = "bg-indigo-200";
                      } else if (filteredEventBlockType === "9") {
                        eventColor = "bg-violet-200";
                      } else if (filteredEventBlockType === "10") {
                        eventColor = "bg-purple-200";
                      } else if (filteredEventBlockType === "11") {
                        eventColor = "bg-pink-200";
                      } else if (filteredEventBlockType === "12") {
                        eventColor = "bg-rose-200";
                      } else {
                        eventColor = "bg-zinc-200";
                      }
                      return (
                        <div
                          className={`${eventColor} mx-0.5 my-0.5 text-nowrap rounded-md p-1 first:mt-1 last:mb-1`}>
                          {convertSecondsToTime(
                            eventBlockEvent.currentEventStartFrameSeconds,
                          )}
                          -
                          {convertSecondsToTime(
                            eventBlockEvent.currentEventEndFrameSeconds,
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {
                    <PlotFigure
                      options={{
                        width:
                          Math.trunc(
                            (eventBlock.eventBlockDurationSeconds /
                              totalDuration) *
                              1920,
                          ) - 2,
                        height: 64,
                        grid: true,
                        axis: null,
                        y: { domain: [0, 5] },
                        marks: [
                          Plot.lineY(eventBlock.eventBlockDensityValues, {
                            curve: "step-after",
                          }),
                          Plot.ruleY([0]),
                        ],
                      }}
                    />
                  }
                </div>
              );
            })}
          </div>
          <Slider
            min={0}
            max={timelineThreeMax}
            value={timelineThreeValue}
            onChange={timelineThreeSeekHandler}
            onChangeCommitted={timelineThreeSeekMouseUpHandler}
            className={`!text-white`}
          />
        </div>
      );
    }
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

    const eventTypesArray = Array.from(eventTypes).sort(
      (a, b) => a.split(":")[0] - b.split(":")[0],
    );

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
      <div
        className={`VideoPlayer-timelineContainer relative mx-auto w-[1920px] bg-dark text-primary ${timeline.value === "timeline2" || timeline.value === "timeline4" ? "pt-20" : ""}`}>
        {(timeline.value === "timeline2" || timeline.value === "timeline4") && (
          <div className="absolute top-4">
            <PlotFigure
              options={{
                width: 1920,
                height: 80,
                grid: true,
                axis: null,
                y: { domain: [0, 5] },
                marks: [
                  Plot.lineY(densityFunctionHandler(), {
                    curve: "step-after",
                  }),
                ],
              }}
            />
          </div>
        )}
        {highlightGraph && timeline.value === "timeline4" && (
          <div className="absolute top-4 text-white">
            <PlotFigure
              options={{
                width: 1920,
                height: 80,
                grid: true,
                axis: null,
                y: { domain: [0, 5] },
                marks: [
                  Plot.lineY(highlightDensityFunctionHandler(), {
                    curve: "step-after",
                  }),
                ],
              }}
            />
          </div>
        )}
        <Slider
          min={0}
          max={videoState.duration}
          value={videoState.played * videoState.duration}
          onChange={seekHandler}
          onChangeCommitted={seekMouseUpHandler}
          className="!text-primary"
        />
        {(timeline.value === "timeline3" || timeline.value === "timeline4") &&
          timelineThreeHandler()}
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
            {timeline.value !== "timeline1" && (
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
