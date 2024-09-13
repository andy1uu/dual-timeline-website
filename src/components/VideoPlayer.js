"use client";

import React, { useEffect, useRef, useState } from "react";

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
import ImageZoom from "react-image-zooom";

import { useSearchParams } from "next/navigation";
import CustomListBox from "./utils/CustomListBox";
import CustomSwitch from "./utils/CustomSwitch";
import EventBlockList from "./utils/EventBlockList";
import PlotFigure from "./utils/PlotFigure";

const VideoPlayer = () => {
  const searchParams = useSearchParams();
  const videos = [VIRAT_S_0002, VIRAT_S_0100, VIRAT_S_0102, VIRAT_S_0400];
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [playbackRate, setPlaybackRate] = useState({
    key: 1,
    label: 1,
    value: 1,
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
  const [selectedEventType, setSelectedEventType] = useState({
    label: "0: All Events",
  });
  const [timeline, setTimeline] = useState({
    key: "timeline1",
    label: "Timeline 1",
    value: "timeline1",
  });

  const timelineType = searchParams.get("timelinetype");

  const videoType = searchParams.get("videotype");

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

  const [timelineThreeValue, setTimelineThreeValue] = useState(0);

  const [highlightGraph, setHighlightGraph] = useState(false);
  const [highlightGraphBlock, setHighlightGraphBlock] = useState({});

  const [toggleRectangles, setToggleRectangles] = useState(true);

  const [zoomAmount, setZoomAmount] = useState({
    key: 200,
    label: 200,
    value: 200,
  });

  const zoomAmounts = [
    {
      key: 200,
      label: 200,
      value: 200,
    },
    {
      key: 300,
      label: 300,
      value: 300,
    },
    {
      key: 400,
      label: 400,
      value: 400,
    },
  ];

  const videoPlayerRef = useRef(null);
  const currentFrame = useRef(0);
  const canvasRef = useRef(null);

  const videoWidth = 1280;
  const videoHeight = 720;

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
    setSelectedEventType({
      label: "0: All Events",
    });
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
    if (toggleRectangles) {
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
    if (selectedEventType.label === "0: All Events") {
      return;
    }
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
                selectedVideo={selectedVideo}
                handleTimelineFiveClick={handleTimelineFiveClick}
                zoomAmount={zoomAmount}
              />
            );
          })}
        </div>
        <Slider
          min={0}
          max={videoWidth}
          value={timelineThreeValue}
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
      <div className="bg-green flex h-[870px] w-80 flex-col gap-y-4 overflow-y-auto text-dark">
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
                key={currentEvent.currentEventID}
                style={{ backgroundColor: `${eventColor}` }}
                className={`flex w-80 flex-col rounded-xl p-2 ${clicked ? "opacity-50" : ""}`}>
                <ImageZoom
                  src={`/images/${selectedVideo.label}/${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}.png`}
                  width={288}
                  height={300}
                  alt={`${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}`}
                  className="!mx-auto !my-2 rounded-xl"
                  zoom={zoomAmount.value}
                />
                <button
                  onClick={() => {
                    clicked = true;
                    handleTimelineFiveClick(currentEvent);
                  }}
                  className="mx-auto flex w-72 flex-col">
                  <p className="w-72 text-wrap">
                    {currentEvent.currentEventName}
                  </p>
                  <p className="w-72 text-wrap">
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
    <div className="VideoPlayer-container flex w-full p-4 justify-center">
      {/* <div className="w-72">NEW CONTROLLS DUMY THING</div> */}
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
            <div className="absolute top-4 text-white">
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
            <CustomSwitch
              label={"Toggle Rectangles"}
              checked={toggleRectangles}
              setChecked={setToggleRectangles}
            />
            {!timelineType && <CustomListBox
              value={timeline}
              setFunction={setTimeline}
              options={timelineTypes}
              width={200}
            />}
            {!videoType && <CustomListBox
              value={selectedVideo}
              setFunction={changeVideoHandler}
              options={videos}
              width={200}
            />}
            <CustomListBox
              value={playbackRate}
              setFunction={playbackRateHandler}
              options={playbackRates}
              width={100}
            />
            <CustomListBox
              value={zoomAmount}
              setFunction={setZoomAmount}
              options={zoomAmounts}
              width={100}
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
      {timelineFiveHandler()}
    </div>
  );
};

export default VideoPlayer;
