"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import ReactPlayer from "react-player";
import ImageZoom from "react-image-zooom";

import { Slider } from "@mui/material";
import * as Plot from "@observablehq/plot";
import { useSearchParams } from "next/navigation";
import { playbackRates } from "@/utils/PlaybackRates";
import { timelineTypes } from "@/utils/TimelineTypes";
import { VIRAT_S_0000 } from "@/utils/VideoData/VIRAT_S_0000";
import { VIRAT_S_0002 } from "@/utils/VideoData/VIRAT_S_0002";
import { VIRAT_S_0100 } from "@/utils/VideoData/VIRAT_S_0100";
import { VIRAT_S_0102 } from "@/utils/VideoData/VIRAT_S_0102";
import { VIRAT_S_0400 } from "@/utils/VideoData/VIRAT_S_0400";
import { VIRAT_S_0500 } from "@/utils/VideoData/VIRAT_S_0500";
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import { FaBackward, FaForward, FaPause, FaPlay } from "react-icons/fa";
import { convertSecondsToTime, eventColorFinder, fastFowardHandler, heightConverter, playPauseHandler, rewindHandler, timelineEventFilterer, widthConverter } from "@/utils/HelperFunctions";

import PlotFigure from "./utils/PlotFigure";
import CustomCheckbox from "./utils/CustomCheckbox";
import EventBlockList from "./utils/EventBlockList";
import CustomRadioGroup from "./utils/CustomRadioGroup";

const VideoPlayer = () => {
  const searchParams = useSearchParams();
  const videos = [VIRAT_S_0000, VIRAT_S_0002, VIRAT_S_0100, VIRAT_S_0102, VIRAT_S_0400, VIRAT_S_0500];
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [playbackRate, setPlaybackRate] = useState({
    key: 1,
    label: "1.00x",
    value: 1,
  });

  const zoomAmount = {
    key: 300,
    label: "300%",
    value: 300,
  };

  const [videoState, setVideoState] = useState({
    playing: true,
    muted: true,
    controls: false,
    played: 0,
    seeking: false,
    Buffer: true,
    duration: selectedVideo.duration,
    playbackRate: 1,
  });
  const [videoEvents, setVideoEvents] = useState(
    selectedVideo.events.sort(
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

  const [timelinesUsedPassword, setTimelinesUsedPassword] = useState(0);

  const [timelineThreeValue, setTimelineThreeValue] = useState(0);

  const [highlightGraph, setHighlightGraph] = useState(false);
  const [highlightGraphBlock, setHighlightGraphBlock] = useState({});

  const [toggleBoundaryBoxes, setToggleBoundaryBoxes] = useState(true);

  const [videoWidth, setVideoWidth] = useState(854);
  const [videoHeight, setVideoHeight] = useState(480);

  const videoPlayerRef = useRef(null);
  const currentFrame = useRef(0);
  const canvasRef = useRef(null);
  const highlightGraphInEvent = useRef(false);
  const highlightGraphBlockInEvent = useRef({});

  const timelinesUsed = searchParams.get("password");

  const videoType = searchParams.get("videotype");


  const handleWindowResize = useCallback(() => {

    if (window.innerWidth >= 1536) {
      setVideoWidth(1280);
      setVideoHeight(720);
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
      const videoTypesKeys = videos.map((video) => video.label);

      if (videoTypesKeys.includes(videoType)) {
        changeVideoHandler(
          videos.find((video) => videoType == video.label),
        );
      }
    }

    let randomNumber = 69368;

    if (timelinesUsed) {
      let timelineTypesCopy = JSON.parse(JSON.stringify(timelineTypes));

      let localTimelinesUsed = "" + (parseInt(timelinesUsed) - randomNumber);

      for (let timelineKey of localTimelinesUsed) {
        timelineTypesCopy = timelineTypesCopy.filter(timelineType => timelineType.key !== parseInt(timelineKey));
      }

      if (timelineTypesCopy.length > 0) {
        let randomTimelineIndex = Math.floor(Math.random() * timelineTypesCopy.length);

        setTimeline(
          timelineTypesCopy[randomTimelineIndex],
        );
        setTimelinesUsedPassword(randomNumber + parseInt(localTimelinesUsed + timelineTypesCopy[randomTimelineIndex].key));
      }
      else {
        // select a random number from 1-5 
        let randomTimelineKey = Math.floor(Math.random() * timelineTypes.length) + 1;

        setTimeline(
          timelineTypes.find((timeType) => randomTimelineKey === timeType.key),
        );
        setTimelinesUsedPassword(randomNumber + randomTimelineKey);
      }

    }
    else{
      // select a random number from 1-5 
      let randomTimelineKey = Math.floor(Math.random() * timelineTypes.length) + 1;

      setTimeline(
        timelineTypes.find((timeType) => randomTimelineKey === timeType.key),
      );
      setTimelinesUsedPassword(randomNumber + randomTimelineKey);
    }
  }, [videoType, timelinesUsed]);

  const seekHandler = (e, value) => {
    if (timeline.value === "timeline3" || timeline.value === "timeline4") {
      const eventBlocks = eventBlocksHandler();

      let currentEventBlocks = eventBlocks.filter((eventBlock) => eventBlock.eventBlockEndSeconds <= value);

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
    setSelectedEventType("0: All Events");
  };

  const densityFunctionHandler = useCallback(() => {
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
  }, [selectedEventType, selectedVideo.duration, videoEvents]);

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

  const highlightDensityFunctionInEventHandler = () => {
    const highlightedDensityFunctionInEventValues = new Array(
      Math.ceil(selectedVideo.duration),
    ).fill(0);

    if (highlightGraphBlockInEvent.current) {
      for (
        let indexToHighlight = highlightGraphBlockInEvent.current.eventBlockStartSeconds;
        indexToHighlight < highlightGraphBlockInEvent.current.eventBlockEndSeconds;
        indexToHighlight++
      ) {
        highlightedDensityFunctionInEventValues[indexToHighlight] =
          highlightGraphBlockInEvent.current.eventBlockDensityValues[
          indexToHighlight - highlightGraphBlockInEvent.current.eventBlockStartSeconds
          ];
      }
    }

    return highlightedDensityFunctionInEventValues;
  };

  const eventBlocksHandler = useCallback(() => {
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
              .filter((filteredEvent) => (
                startSecondIndex - 1 <
                Math.ceil(filteredEvent.currentEventStartFrameSeconds) &&
                secondIndex >=
                Math.floor(filteredEvent.currentEventEndFrameSeconds)
              ))
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
          .filter((filteredEvent) => (
            startSecondIndex - 1 <
            Math.ceil(filteredEvent.currentEventStartFrameSeconds) &&
            densityFunctionValues.length >=
            Math.floor(filteredEvent.currentEventEndFrameSeconds)
          ))
          .sort(
            (a, b) =>
              parseFloat(a.currentEventStartFrameSeconds) -
              parseFloat(b.currentEventStartFrameSeconds),
          ),
      });
    }
    return eventBlocks;
  }, [densityFunctionHandler, selectedEventType, videoEvents]);

  const timelineThreeTotalDurationHandler = useCallback(() => {
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
  }, [eventBlocksHandler]);

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

    let currentEvents = filteredEvents.filter((currentEvent) => (
      currentEvent.currentEventStartFrame <= currentFrame.current &&
      currentEvent.currentEventEndFrame >= currentFrame.current
    ));

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

      let currentEventBlock = eventBlocks.find((eventBlock) => (
        eventBlock.eventBlockEndSeconds >= currentTime &&
        eventBlock.eventBlockStartSeconds <= currentTime
      ));
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
        let currentEventBlocks = eventBlocks.filter((eventBlock) => eventBlock.eventBlockEndSeconds <= currentTime);

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
  }, [videoState, eventBlocksHandler, timeline.value, timelineThreeTotalDurationHandler, videoWidth]);

  useEffect(() => {
    const eventBlocks = eventBlocksHandler();

    let currentEventBlocks = eventBlocks.filter((eventBlock) => eventBlock.eventBlockEndSeconds <= videoState.played);

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

  useEffect(() => {
    if (timeline.value === "timeline2" || timeline.value === "timeline4") {
    const eventBlocks = eventBlocksHandler();

      let currentEventBlock = eventBlocks.find(
        (eventBlock) => (
          eventBlock.eventBlockEndSeconds >=
          videoPlayerRef.current.getCurrentTime() &&
          eventBlock.eventBlockStartSeconds <=
          videoPlayerRef.current.getCurrentTime()
        ),
      );

      if(currentEventBlock) {
        highlightGraphInEvent.current = true;
        highlightGraphBlockInEvent.current = currentEventBlock;
      }
      else {
        highlightGraphInEvent.current = false;
        highlightGraphBlockInEvent.current = {};
      }
    }
  });

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
              (eventBlock) => (
                eventBlock.currentEventEndFrameSeconds >=
                videoPlayerRef.current.getCurrentTime() &&
                eventBlock.currentEventStartFrameSeconds <=
                videoPlayerRef.current.getCurrentTime()
              ),
            );

            const filteredEventBlockTypeNumber = parseInt(
              eventBlock.eventBlockEventType.split(":")[0],
            );

            let eventColor = eventColorFinder(filteredEventBlockTypeNumber);

            return (
              <EventBlockList
                key={"EventBlockList"}
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
          className={`!p-0 !text-white`}
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

    return filteredEvents.map((currentEvent) => {
        const filteredEventTypeNumber = parseInt(
          currentEvent.currentEventName.split(":")[0],
          10,
        );
        let eventColor = eventColorFinder(filteredEventTypeNumber);

        return (
          <div
            key={"TimelineFiveKey" + currentEvent.currentEventVideoName + (currentEvent.currentEventID.toString())}
            style={{ backgroundColor: `${eventColor}` }}
            className="flex h-44 w-48 flex-col rounded-lg"
            onClick={() => handleTimelineFiveClick(currentEvent)}>
            <ImageZoom
              src={`/images/${selectedVideo.label}/${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}.png`}
              width={192}
              height={200}
              alt={`${currentEvent.currentEventVideoName}_${currentEvent.currentEventID}`}
              className="!w-48 rounded-lg"
              zoom={zoomAmount.value}
            />
            {/* add underline to text when user hovers over it */}
            <button
              className="flex w-full cursor-pointer flex-col justify-center hover:underline">
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
      })

  };

  return (
    <div className="Container mx-auto flex flex-col lg:!w-[1024px] lg:text-sm xl:!w-[1280px] xl:text-xl 2xl:!w-[1536px]">
      <div className="SideBarAndVideoPlayer-container flex h-fit text-primary">
        <div className="SideBar flex h-full flex-col gap-3 bg-dark p-2 lg:!w-[170px] xl:!w-[426px] xl:text-xl 2xl:!w-[256px]">
          <a className="TimelinesUsedPassword-label text-pretty underline" href={timeline.link}>Please watch this tutorial if {timeline.label} is confusing.</a>
          <p className="TimelinesUsedPassword-label mx-auto flex">Password: {timelinesUsedPassword}</p>
          {timeline.value !== "timeline1" && (<div className="EventTypes-container flex flex-col gap-2">
            
            <p className="EventTypes-label mx-auto flex">Event Types</p>
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
            {highlightGraphInEvent.current && (timeline.value === "timeline2" || timeline.value === "timeline4") && (
              <div className="absolute top-4 text-white">
                <PlotFigure
                  options={{
                    width: videoWidth,
                    height: 64,
                    grid: true,
                    axis: null,
                    y: { domain: [0, Math.max(...densityFunctionHandler())] },
                    marks: [
                      Plot.lineY(highlightDensityFunctionInEventHandler(), {
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
              className="!p-0 !text-primary"
            />
            <div className="flex justify-between p-2 font-semibold lg:text-xl xl:text-2xl">
              <div>
                {convertSecondsToTime(videoState.played * videoState.duration)}
              </div>
              <CustomCheckbox
                label={"Boundary Boxes:"}
                checked={toggleBoundaryBoxes}
                setChecked={setToggleBoundaryBoxes}
              />
              <div className="VideoPlayer-controls flex w-fit gap-2">
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
                  className="VideoPlayer-playPauseButtons my-auto"
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
              <p className="PlayBackRate-label my-auto">Playback Rate: {playbackRate.label}</p>
              <div>{convertSecondsToTime(videoState.duration)}</div>
            </div>
          </div>
          {timeline.value === "timeline5" && <div className="2xl:text-md flex gap-1 overflow-x-scroll bg-dark text-dark xl:text-sm">
            {timelineFiveHandler()}
          </div>}
        </div>
        
      </div>
    </div>
  );
};

export default VideoPlayer;
