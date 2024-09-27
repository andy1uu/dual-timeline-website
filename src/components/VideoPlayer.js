"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

import * as d3 from "d3";
import ReactPlayer from "react-player";

import {
  convertSecondsToTime,
  eventColorFinder,
  fastFowardHandler,
  heightConverter,
  playPauseHandler,
  rewindHandler,
  timelineEventFilterer,
  widthConverter,
} from "@/utils/HelperFunctions";
import { playbackRates } from "@/utils/PlaybackRates";
import { timelineTypes } from "@/utils/TimelineTypes";
import { VIRAT_S_0002 } from "@/utils/VideoData/VIRAT_S_0002";
import { VIRAT_S_0100 } from "@/utils/VideoData/VIRAT_S_0100";
import { VIRAT_S_0102 } from "@/utils/VideoData/VIRAT_S_0102";
import { VIRAT_S_0400 } from "@/utils/VideoData/VIRAT_S_0400";
import { Slider } from "@mui/material";
import * as Plot from "@observablehq/plot";
import { FaBackward, FaForward, FaPause, FaPlay } from "react-icons/fa";
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import ImageZoom from "react-image-zooom";

import { useSearchParams } from "next/navigation";
import CustomCheckbox from "./utils/CustomCheckbox";
import CustomRadioGroup from "./utils/CustomRadioGroup";
import EventBlockList from "./utils/EventBlockList";
import PlotFigure from "./utils/PlotFigure";

const VideoPlayer = () => {
  const searchParams = useSearchParams();
  const videos = [VIRAT_S_0002, VIRAT_S_0100, VIRAT_S_0102, VIRAT_S_0400];
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [playbackRate, setPlaybackRate] = useState({
    key: 1,
    label: "1.00x",
    value: 1,
  });

  const [zoomAmount, setZoomAmount] = useState({
    key: 300,
    label: "300%",
    value: 300,
  });

  const [videoState, setVideoState] = useState({
    playing: true,
    muted: true,
    controls: false,
    played: 0,
    seeking: false,
    Buffer: true,
    duration: videos[0].duration,
    playbackRate: 1,
  });
  const [videoEvents, setVideoEvents] = useState(
    videos[0].events.sort(
      (a, b) =>
        parseFloat(a.currentEventStartFrameSeconds) -
        parseFloat(b.currentEventStartFrameSeconds),
    ),
  );
  const [selectedEventType, setSelectedEventType] = useState("0: All Events"
  );
  const [timeline, setTimeline] = useState({
    key: "timeline1",
    label: "Timeline 1",
    value: "timeline1",
  });

  const [timelineThreeValue, setTimelineThreeValue] = useState(0);

  const [highlightGraph, setHighlightGraph] = useState(false);
  const [highlightGraphBlock, setHighlightGraphBlock] = useState({});

  const [toggleBoundaryBoxes, setToggleBoundaryBoxes] = useState(true);

  const [videoWidth, setVideoWidth] = useState(854);
  const [videoHeight, setVideoHeight] = useState(480);
  const [sideBarWidth, setSideBarWidth] = useState(170);

  const videoPlayerRef = useRef(null);
  const currentFrame = useRef(0);
  const canvasRef = useRef(null);

  const timelineType = searchParams.get("timelinetype");

  const videoType = searchParams.get("videotype");

  const handleWindowResize = useCallback(event => {
    console.log(window.innerWidth);
    if (window.innerWidth >= 1920) {
      console.log("The window width is greater than or equal to 1920.")
      setVideoWidth(1280);
      setVideoHeight(720);
      setSideBarWidth(320);
    }
    else if (window.innerWidth >= 1280) {
      console.log("The window width is greater than or equal to 1280.")
      setSideBarWidth(320);
    }
    else if (window.innerWidth >= 1024) {
      console.log("The window width is greater than or equal to 1024.")
      setVideoWidth(854);
      setVideoHeight(480);
      setSideBarWidth(170);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleWindowResize]);

  useEffect(() => {

    if (videoType) {
      const videoTypesKeys = videos.map((video) => {
        return video.label;
      });

      if (videoTypesKeys.includes(videoType)) {
        changeVideoHandler(
          videos.find((video) => videoType == video.label),
        );
      }
    }

    if (timelineType) {
      const timelineTypesKeys = timelineTypes.map((timelineType) => {
        return timelineType.key;
      });

      if (timelineTypesKeys.includes(timelineType)) {
        setTimeline(
          timelineTypes.find((timeType) => timelineType == timeType.key),
        );
      }
    }
  }, []);

  const seekHandler = (e, value) => {
    if (timeline.value === "timeline3" || timeline.value === "timeline4") {
      const eventBlocks = eventBlocksHandler();

      let currentEventBlocks = eventBlocks.filter((eventBlock) => {
        return eventBlock.eventBlockEndSeconds <= value;
      });

      if (currentEventBlocks.length === eventBlocks.length) {
        setTimelineThreeValue(videoWidth);
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

        setTimelineThreeValue(videoWidth * (currentDuration / totalDuration));
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

  const playbackRateHandler = (newPlaybackRate) => {
    setPlaybackRate(newPlaybackRate);
    setVideoState({
      ...videoState,
      playbackRate: newPlaybackRate.value,
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
      playbackRate: 1,
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
    setSelectedEventType("0: All Events");
    setPlaybackRate({
      key: 1,
      label: 1,
      value: 1,
    });
    setHighlightGraph(false);
    setHighlightGraphBlock({});
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
            eventBlockEventType: selectedEventType,
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
        eventBlockEventType: selectedEventType,
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

  const timelineThreeSeekMouseUpHandler = (e, value) => {
    setTimelineThreeValue(value);

    const eventBlocks = eventBlocksHandler();

    const totalDuration = timelineThreeTotalDurationHandler();

    let currentEventBlockStart = totalDuration;
    let filteredEventBlockIndex = eventBlocks.length - 1;

    while (filteredEventBlockIndex >= 0) {
      currentEventBlockStart -=
        eventBlocks[filteredEventBlockIndex].eventBlockDurationSeconds;
      if (currentEventBlockStart < totalDuration * (value / videoWidth)) break;
      filteredEventBlockIndex--;
    }

    seekMouseUpHandler(
      null,
      eventBlocks[filteredEventBlockIndex].eventBlockStartSeconds +
      (totalDuration * (value / videoWidth) - currentEventBlockStart),
    );
  };

  useEffect(() => {
    currentFrame.current = Math.round(
      videoPlayerRef.current.getCurrentTime() * selectedVideo.frameRate,
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
    if (toggleBoundaryBoxes) {
      // Draw each rectangle
      currentEvents.map((currVideoEventRect) => {
        let rectWidthMin =
          currVideoEventRect.currentEventRectWidthMin[currentFrame.current];
        let rectHeightMin =
          currVideoEventRect.currentEventRectHeightMin[currentFrame.current];
        let rectWidthMax =
          currVideoEventRect.currentEventRectWidthMax[currentFrame.current];
        let rectHeightMax =
          currVideoEventRect.currentEventRectHeightMax[currentFrame.current];
        if (
          rectWidthMin != 0 &&
          rectWidthMax != 0 &&
          rectHeightMin != 0 &&
          rectHeightMax != 0
        ) {
          let currVideoEventRectLeft =
            widthConverter(
              rectWidthMin,
              currVideoEventRect.currentEventVideoWidth,
              videoWidth,
            ) - 25;
          let currVideoEventRectTop =
            heightConverter(
              rectHeightMin,
              currVideoEventRect.currentEventVideoHeight,
              videoHeight,
            ) - 25;
          let currVideoEventRectWidth = rectWidthMax - rectWidthMin + 50;
          let currVideoEventRectHeight = rectHeightMax - rectHeightMin + 50;
          ctx.strokeStyle = "#E5751F";
          ctx.lineWidth = 4;
          ctx.strokeRect(
            currVideoEventRectLeft,
            currVideoEventRectTop,
            currVideoEventRectWidth,
            currVideoEventRectHeight,
          );
        }
      });
    }
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

        setTimelineThreeValue(videoWidth * (currentDuration / totalDuration));
        return;
      } else {
        let currentEventBlocks = eventBlocks.filter((eventBlock) => {
          return eventBlock.eventBlockEndSeconds <= currentTime;
        });

        if (currentEventBlocks.length === eventBlocks.length) {
          setTimelineThreeValue(videoWidth);
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

          setTimelineThreeValue(videoWidth * (currentDuration / totalDuration));
        }
      }
    }
  }, [videoState]);

  useEffect(() => {
    const eventBlocks = eventBlocksHandler();

    let currentEventBlocks = eventBlocks.filter((eventBlock) => {
      return eventBlock.eventBlockEndSeconds <= videoState.played;
    });

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

    setTimelineThreeValue(videoWidth * (currentDuration / totalDuration));
  }, []);

  const timelineThreeHandler = () => {
    const eventBlocks = eventBlocksHandler();

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
      <div className="bg-dark py-2 !text-black">
        <div
          className={`flex justify-between`}
          style={{ width: `${videoWidth}px` }}>
          {eventBlocks.map((eventBlock) => {
            let isCurrentEventHappening = eventBlock.eventBlockEvents.find(
              (eventBlock) => {
                return (
                  eventBlock.currentEventEndFrameSeconds >=
                  videoPlayerRef.current.getCurrentTime() &&
                  eventBlock.currentEventStartFrameSeconds <=
                  videoPlayerRef.current.getCurrentTime()
                );
              },
            );

            const filteredEventBlockTypeNumber = parseInt(
              eventBlock.eventBlockEventType.split(":")[0],
            );

            let eventColor = eventColorFinder(filteredEventBlockTypeNumber);

            return (
              <EventBlockList
                eventBlock={eventBlock}
                totalDuration={totalDuration}
                videoWidth={videoWidth}
                eventColor={eventColor}
                isCurrentEventHappening={isCurrentEventHappening}
                handleTimelineFiveClick={handleTimelineFiveClick}
                setHighlightGraph={setHighlightGraph}
                setHighlightGraphBlock={setHighlightGraphBlock}
              />
            );
          })}
        </div>
        <Slider
          min={0}
          max={videoWidth}
          value={timelineThreeValue}
          onChangeCommitted={timelineThreeSeekMouseUpHandler}
          className={`!text-white !p-0`}
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

    return eventTypesArray;
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
      <div className="flex gap-x-1 mx-auto overflow-x-scroll text-dark bg-dark" style={{ width: `${videoWidth + sideBarWidth}px` }}>
        {timeline.value === "timeline5" &&
          filteredEvents.map((currentEvent) => {
            const filteredEventTypeNumber = parseInt(
              currentEvent.currentEventName.split(":")[0],
              10,
            );
            let clicked = false;
            let eventColor = eventColorFinder(filteredEventTypeNumber);

            return (
              <div
                key={"TimelineFiveKey" + currentEvent.currentEventVideoName + (currentEvent.currentEventID.toString())}
                style={{ backgroundColor: `${eventColor}` }}
                className={`flex flex-col w-48 h-40 rounded-lg lg:text-xs ${clicked ? "opacity-50" : ""}`}
                onClick={() => {
                  clicked = true;
                  handleTimelineFiveClick(currentEvent);
                }}>
                <ImageZoom
                  src={`/images/${selectedVideo.label}/${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}.png`}
                  width={192}
                  height={200}
                  alt={`${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}`}
                  className="rounded-lg !w-48"
                  zoom={zoomAmount.value}
                />
                {/* add underline to text when user hovers over it */}
                <button
                  className="flex w-full flex-col justify-center hover:underline cursor-pointer">
                  <p className="w-full text-wrap">
                    {currentEvent.currentEventName}
                  </p>
                  <p className=" w-full text-wrap">
                    {"Time: " +
                      convertSecondsToTime(
                        currentEvent.currentEventStartFrameSeconds,
                      ) +
                      " - " +
                      convertSecondsToTime(
                        currentEvent.currentEventEndFrameSeconds,
                      )}
                  </p>
                </button>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="Container w-full flex flex-col">
      <div className="SideBarAndVideoPlayer-container mx-auto flex h-fit text-primary">
        <div className="SideBar gap-3 flex flex-col p-2 bg-dark overflow-y-auto" style={{ width: `${sideBarWidth}px` }}>
          <CustomCheckbox
            label={"Toggle Boundary Boxes:"}
            checked={toggleBoundaryBoxes}
            setChecked={setToggleBoundaryBoxes}
          />
          <p className="PlayBackRate-label lg:text-xs">Playback Rate: {playbackRate.label}</p>
          {timeline.value !== "timeline1" && (<div className="EventTypes-container gap-2 flex flex-col lg:text-xs">
            <p className="EventTypes-label flex mx-auto ">Event Types</p>
            <CustomRadioGroup
              value={selectedEventType}
              setFunction={currentEventTypeHandler}
              options={eventTypesHandler()}
              label={"Event Types"}
            />
          </div>)}
        </div>
        <div
          className="VideoPlayer flex flex-col"
          style={{ width: `${videoWidth}px` }}>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={videoWidth}
              height={videoHeight}
              className="absolute z-10"
            />
            <ReactPlayer
              url={selectedVideo.link}
              ref={videoPlayerRef}
              playing={videoState.playing}
              controls={videoState.controls}
              muted={videoState.muted}
              width={videoWidth}
              height={videoHeight}
              onProgress={progressHandler}
              playbackRate={videoState.playbackRate}
              progressInterval={100}
              className="VideoPlayer-video pointer-events-none z-0"
            />
          </div>
          {(timeline.value === "timeline3" || timeline.value === "timeline4") &&
            timelineThreeHandler()}
          <div
            className={`VideoPlayer-timelineContainer relative mx-auto bg-dark text-primary ${timeline.value === "timeline2" || timeline.value === "timeline4" ? "pt-16" : ""}`}
            style={{ width: `${videoWidth}px` }}>
            {(timeline.value === "timeline2" ||
              timeline.value === "timeline4") && (
                <div className="absolute top-4">
                  <PlotFigure
                    options={{
                      width: videoWidth,
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
              <div className="absolute top-4 text-lime-600">
                <PlotFigure
                  options={{
                    width: videoWidth,
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
              className="!text-primary !p-0"
            />
            <div className="flex justify-between p-2 text-xl font-semibold">
              <div>
                {convertSecondsToTime(videoState.played * videoState.duration)}
              </div>
              <div className="VideoPlayer-controls mx-auto flex w-fit">
                <div
                  className="VideoPlayer-slowDownButton my-auto"
                  onClick={() => {
                    if (playbackRates.findIndex(playRate => playRate.key == playbackRate.key) - 1 > -1) {


                      playbackRateHandler(playbackRates[playbackRates.findIndex(playRate => playRate.key == playbackRate.key) - 1])
                    }
                  }}>
                  <FaBackward size="24px" />
                </div>
                <div
                  className="VideoPlayer-goBackTenSecondsButton my-auto "
                  onClick={() => rewindHandler(videoPlayerRef)}>
                  <TbRewindBackward10 size="24px" />
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
                  className="VideoPlayer-skipTenSecondsButton my-auto"
                  onClick={() => fastFowardHandler(videoPlayerRef)}>
                  <TbRewindForward10 size="24px" />
                </div>
                <div
                  className="VideoPlayer-speedUpButton my-auto"
                  onClick={() => {
                    if (playbackRates.findIndex(playRate => playRate.key == playbackRate.key) + 1 < playbackRates.length) {


                      playbackRateHandler(playbackRates[playbackRates.findIndex(playRate => playRate.key == playbackRate.key) + 1])
                    }
                  }}>
                  <FaForward size="24px" />
                </div>
              </div>
              <div>{convertSecondsToTime(videoState.duration)}</div>
            </div>
          </div>
        </div>
      </div>
      {timelineFiveHandler()}
    </div>
  );
};

export default VideoPlayer;
