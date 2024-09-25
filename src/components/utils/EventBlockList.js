import React, { forwardRef, useState } from "react";
import clickOutside from "./clickOutside";
import PlotFigure from "./PlotFigure";
import * as Plot from "@observablehq/plot";
import Event from "./Event";

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
      zoomAmount,
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
            <div className="absolute bottom-14 z-10 flex h-72 w-fit flex-col gap-1 overflow-auto rounded-md bg-white p-1">
              {eventBlock.eventBlockEvents.map((eventBlockEvent) => {
                return (
                  <Event
                    eventBlockEvent={eventBlockEvent}
                    zoomAmount={zoomAmount}
                    eventColor={eventColor}
                    selectedVideo={selectedVideo}
                    handleTimelineFiveClick={handleTimelineFiveClick}
                  setOpen={setOpen}
                  />
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
