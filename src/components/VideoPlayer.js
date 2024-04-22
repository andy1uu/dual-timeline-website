"use client";

import { timelineTypes } from "@/utils/TimelineTypes";
import { Slider } from "@mui/material";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import Image from "next/image";
import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  FaBackward,
  FaCheck,
  FaChevronDown,
  FaForward,
  FaPause,
  FaPlay,
} from "react-icons/fa";
import ReactPlayer from "react-player";
import PlotFigure from "./utils/PlotFigure";
import CustomListBox from "./utils/CustomListBox";
import {
  convertSecondsToTime,
  heightConverter,
  widthConverter,
  timelineEventFilterer,
  playPauseHandler,
  rewindHandler,
  fastFowardHandler,
} from "@/utils/HelperFunctions";
import { VIRAT_S_0002 } from "@/utils/VideoData/VIRAT_S_0002";
import { VIRAT_S_0100 } from "@/utils/VideoData/VIRAT_S_0100";
import { VIRAT_S_0102 } from "@/utils/VideoData/VIRAT_S_0102";
import { VIRAT_S_0400 } from "@/utils/VideoData/VIRAT_S_0400";

const VideoPlayer = () => {
  const videos = [VIRAT_S_0002, VIRAT_S_0100, VIRAT_S_0102, VIRAT_S_0400];
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
  const currentFrame = useRef(0);

  const timelineThreeMax = 1000;
  const videoWidth = 1280;
  const videoHeight = 720;

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

  const densityFunctionHandler = () => {
    const eventsPerSecond = new Array(Math.ceil(selectedVideo.duration)).fill(
      0,
    );

    // Get the filtered events
    const filteredEvents = timelineEventFilterer(
      selectedEventType,
      videoEvents,
    );

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
    const filteredEvents = timelineEventFilterer(
      selectedEventType,
      videoEvents,
    );
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

  const canvasRef = useRef(null);

  useEffect(() => {
    currentFrame.current = Math.round(
      videoPlayerRef.current.getCurrentTime() * 30,
    );
    const filteredEvents = timelineEventFilterer(
      selectedEventType,
      videoEvents,
    );

    let currentEvents = filteredEvents.filter((currentEvent) => {
      return (
        currentEvent.currentEventStartFrame <= currentFrame.current &&
        currentEvent.currentEventEndFrame >= currentFrame.current
      );
    });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each rectangle
    currentEvents.map((currVideoEventRect) => {
      let currVideoEventRectLeft = widthConverter(
        currVideoEventRect.currentEventRectWidthMin[currentFrame.current],
        currVideoEventRect.currentEventVideoWidth,
        videoWidth,
      );
      let currVideoEventRectTop = heightConverter(
        currVideoEventRect.currentEventRectHeightMin[currentFrame.current],
        currVideoEventRect.currentEventVideoHeight,
        videoHeight,
      );
      let currVideoEventRectWidth =
        currVideoEventRect.currentEventRectWidthMax[currentFrame.current] -
        currVideoEventRect.currentEventRectWidthMin[currentFrame.current];
      let currVideoEventRectHeight =
        currVideoEventRect.currentEventRectHeightMax[currentFrame.current] -
        currVideoEventRect.currentEventRectHeightMin[currentFrame.current];
      ctx.strokeStyle = "#E5751F";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        currVideoEventRectLeft,
        currVideoEventRectTop,
        currVideoEventRectWidth,
        currVideoEventRectHeight,
      );
    });
  });

  useEffect(() => {
    if (timeline.value === "timeline3" || timeline.value === "timeline4") {
      const eventBlocks = eventBlocksHandler();

      let currentTime = videoPlayerRef.current.getCurrentTime();

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
    // if (selectedEventType.label === "0: All Events") {
    //   return;
    // }
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
      <div className="!text-black bg-dark py-2">
        <div className=" flex w-[1280px] justify-between">
          {eventBlocks.map((eventBlock) => {
            return (
              <div
                style={{
                  width: `${Math.trunc((eventBlock.eventBlockDurationSeconds / totalDuration) * 1280)}px`,
                }}
                onMouseEnter={() => {
                  setHighlightGraph(true);
                  setHighlightGraphBlock(eventBlock);
                }}
                onMouseLeave={() => {
                  setHighlightGraph(false);
                  setHighlightGraphBlock({});
                }}
                className={`h-16 rounded-lg opacity-75 ${eventColor} group relative mr-[4px] flex`}>
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
                            1280,
                        ) - 2,
                      height: 64,
                      grid: true,
                      axis: null,
                      y: { domain: [0, Math.max(...densityFunctionHandler())] },
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

  const handleTimelineFiveClick = (currentEvent) => {
    seekMouseUpHandler(null, currentEvent.currentEventStartFrameSeconds);
  };

  const timelineFiveHandler = () => {
    const filteredEvents = timelineEventFilterer(
      selectedEventType,
      videoEvents,
    );

    return (
      <div className="flex h-[865px] w-[400px] flex-col gap-4 overflow-y-auto text-dark">
        {filteredEvents.map((currentEvent) => {
          const filteredEventType = currentEvent.currentEventName.split(":")[0];
          let eventColor = "";
          if (filteredEventType === "1") {
            eventColor = "bg-red-200";
          } else if (filteredEventType === "2") {
            eventColor = "bg-orange-200";
          } else if (filteredEventType === "3") {
            eventColor = "bg-yellow-200";
          } else if (filteredEventType === "4") {
            eventColor = "bg-amber-200";
          } else if (filteredEventType === "5") {
            eventColor = "bg-emerald-200";
          } else if (filteredEventType === "6") {
            eventColor = "bg-teal-200";
          } else if (filteredEventType === "7") {
            eventColor = "bg-blue-200";
          } else if (filteredEventType === "8") {
            eventColor = "bg-indigo-200";
          } else if (filteredEventType === "9") {
            eventColor = "bg-violet-200";
          } else if (filteredEventType === "10") {
            eventColor = "bg-purple-200";
          } else if (filteredEventType === "11") {
            eventColor = "bg-pink-200";
          } else if (filteredEventType === "12") {
            eventColor = "bg-rose-200";
          } else {
            eventColor = "bg-zinc-200";
          }
          return (
            <button
              key={Math.random() * 10000000}
              onClick={() => handleTimelineFiveClick(currentEvent)}
              className={` rounded-3xl p-4 ${eventColor}`}>
              <Image
                src={`/images/${selectedVideo.label}/${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}.png`}
                width={400}
                height={350}
                alt={`${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}`}
                className="rounded-xl"
              />
              <div>{currentEvent.currentEventName}</div>
              <div className="flex justify-center gap-1">
                <div>Start Time:</div>
                <div>
                  {convertSecondsToTime(
                    currentEvent.currentEventStartFrameSeconds,
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="VideoPlayer-container mx-auto flex gap-1 py-8">
      {timeline.value === "timeline5" && timelineFiveHandler()}
      <div className="VideoPlayer flex w-[1280px] flex-col">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute z-10"
          />
          <ReactPlayer
            url={selectedVideo.link}
            ref={videoPlayerRef}
            playing={videoState.playing}
            controls={videoState.controls}
            muted={videoState.muted}
            width={1280}
            height={720}
            onProgress={progressHandler}
            className="VideoPlayer-video pointer-events-none z-0"
          />
        </div>
        {(timeline.value === "timeline3" || timeline.value === "timeline4") &&
          timelineThreeHandler()}
        <div
          className={`VideoPlayer-timelineContainer relative mx-auto w-[1280px] bg-dark text-primary ${timeline.value === "timeline2" || timeline.value === "timeline4" ? "pt-16" : ""}`}>
          {(timeline.value === "timeline2" ||
            timeline.value === "timeline4") && (
            <div className="absolute top-4">
              <PlotFigure
                options={{
                  width: 1280,
                  height: 64,
                  grid: true,
                  axis: null,
                  y: { domain: [0, Math.max(...densityFunctionHandler())] },
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
                  width: 1280,
                  height: 64,
                  grid: true,
                  axis: null,
                  y: { domain: [0, Math.max(...densityFunctionHandler())] },
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
          <div className="flex justify-between p-2 text-xl font-semibold">
            <div>
              {convertSecondsToTime(videoState.played * videoState.duration)}
            </div>
            <div className="VideoPlayer-controls mx-auto flex w-fit">
              <div
                className="VideoPlayer-rewindButton my-auto "
                onClick={() => rewindHandler(videoPlayerRef)}>
                <FaBackward size="24px" />
              </div>
              <div
                className="VideoPlayer-playPauseButtons mx-2 my-auto"
                onClick={() => playPauseHandler(videoState, setVideoState)}>
                {videoState.playing ? (
                  <FaPause size="24px" />
                ) : (
                  <FaPlay size="24px" />
                )}
              </div>
              <div
                className="VideoPlayer-fastForwardButton my-auto"
                onClick={() => fastFowardHandler(videoPlayerRef)}>
                <FaForward size="24px" />
              </div>
            </div>
            <div>{convertSecondsToTime(videoState.duration)}</div>
          </div>
          <div className="flex justify-center p-4">
            <CustomListBox
              value={selectedVideo}
              setFunction={changeVideoHandler}
              options={videos}
              width={200}
            />
            <CustomListBox
              value={timeline}
              setFunction={setTimeline}
              options={timelineTypes}
              width={200}
            />
            {timeline.value !== "timeline1" && (
              <CustomListBox
                value={selectedEventType}
                setFunction={currentEventTypeHandler}
                options={eventTypesHandler()}
                width={400}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
