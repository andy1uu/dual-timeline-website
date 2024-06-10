import React, { forwardRef } from "react";
import clickOutside from "./clickOutside";
import PlotFigure from "./PlotFigure";
import * as Plot from "@observablehq/plot";
import Image from "next/image";

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
          key={(Math.random() + 1) * 10000000}
          onClick={() => setOpen(!open)}
          className={`h-16 w-full rounded-lg ${eventColor.toString()} group relative mr-1 flex ${isCurrentEventHappening ? "border border-y-4 border-white" : ""}`}>
          {open && (
            <div className="absolute bottom-14 z-10 w-fit flex-col rounded-md bg-white">
              {eventBlock.eventBlockEvents.map((eventBlockEvent) => {
                return (
                  <button
                    key={(Math.random() + 1) * 10000000}
                    onClick={() => {
                      handleTimelineFiveClick(eventBlockEvent);
                      setOpen(false);
                    }}
                    className={`${eventColor} mx-0.5 my-0.5 h-fit w-[260px] p-1 first:mt-1 last:mb-1`}>
                    <Image
                      src={`/images/${selectedVideo.label}/${eventBlockEvent.currentEventVideoName}_${eventBlockEvent.currentEventID}.png`}
                      width={250}
                      height={220}
                      alt={`${eventBlockEvent.currentEventVideoName}_${eventBlockEvent.currentEventID}`}
                      className="rounded-2xl"
                    />
                  </button>
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
