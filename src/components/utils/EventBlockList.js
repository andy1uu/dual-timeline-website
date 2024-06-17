import React, { forwardRef } from "react";
import clickOutside from "./clickOutside";
import PlotFigure from "./PlotFigure";
import * as Plot from "@observablehq/plot";
import ImageZoom from "react-image-zooom";
import { convertSecondsToTime } from "@/utils/HelperFunctions";

const EventBlockList = forwardRef(
  (
    {
      open,
      setOpen,
      eventBlock,
      totalDuration,
      videoWidth,
      eventColor,
      isCurrentEventHappening,
      selectedVideo,
      handleTimelineFiveClick,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        style={{
          width: `${Math.trunc((eventBlock.eventBlockDurationSeconds / totalDuration) * videoWidth)}px`,
        }}>
        <div
          key={10000000}
          onClick={() => setOpen(true)}
          style={{ backgroundColor: `${eventColor}` }}
          className={`relative mr-1 flex h-16 w-full rounded-lg ${isCurrentEventHappening ? "border border-y-4 border-white" : ""}`}>
          {open && (
            <div className="absolute bottom-14 z-10 flex w-fit flex-col gap-1 rounded-md bg-white p-1 h-72 overflow-auto">
              {eventBlock.eventBlockEvents.map((eventBlockEvent) => {
                return (
                  <div
                    key={eventBlockEvent.currentEventID}
                    style={{ backgroundColor: `${eventColor}` }}
                    className="flex w-80 flex-col rounded-xl p-2">
                    <ImageZoom
                      src={`/images/${selectedVideo.label}/${eventBlockEvent.currentEventVideoName}_${eventBlockEvent.currentEventID}.png`}
                      width={288}
                      height={300}
                      alt={`${eventBlockEvent.currentEventVideoName}_${eventBlockEvent.currentEventID}`}
                      className="!mx-auto !my-2 rounded-xl"
                      zoom={200}
                    />
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleTimelineFiveClick(eventBlockEvent);
                      }}
                      className="mx-auto flex w-72 flex-col">
                      <p className="w-72 text-wrap">
                        {eventBlockEvent.currentEventName}
                      </p>
                      <p className="w-72 text-wrap">
                        {"Time: " +
                          convertSecondsToTime(
                            eventBlockEvent.currentEventStartFrameSeconds,
                          ) +
                          " - " +
                          convertSecondsToTime(
                            eventBlockEvent.currentEventEndFrameSeconds,
                          )}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {
            <PlotFigure
              options={{
                width:
                  Math.trunc(
                    (eventBlock.eventBlockDurationSeconds / totalDuration) *
                      videoWidth,
                  ) - 2,
                height: 56,
                grid: true,
                axis: null,
                y: { domain: [0, 10] },
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
      </div>
    );
  },
);

export default clickOutside(EventBlockList);
