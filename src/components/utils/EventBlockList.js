import React from "react";
import PlotFigure from "./PlotFigure";
import * as Plot from "@observablehq/plot";
import PropTypes from 'prop-types';

const EventBlockList = 
  (
    {
      eventBlock,
      totalDuration,
      videoWidth,
      eventColor,
      isCurrentEventHappening,
      handleTimelineFiveClick,
      setHighlightGraph, setHighlightGraphBlock
    }
  ) => (
      <div
        style={{
          width: `${Math.trunc((eventBlock.eventBlockDurationSeconds / totalDuration) * videoWidth)}px`,
        }}
        onMouseEnter={() => {
          setHighlightGraph(true);
          setHighlightGraphBlock(eventBlock);
        }}
        onMouseLeave={() => {
          setHighlightGraph(false);
          setHighlightGraphBlock({});
        }}
        onClick={() =>
          handleTimelineFiveClick(eventBlock.eventBlockEvents[0])
        }>
        <div
          
          style={{ backgroundColor: `${eventColor}` }}
          className={`relative mr-1 flex h-16 w-full rounded-lg hover:border hover:border-y-4 hover:border-lime-600 ${isCurrentEventHappening ? "border border-y-4 border-white" : ""}`}>
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
    
EventBlockList.propTypes = {
  eventBlock: PropTypes.object.isRequired,
  totalDuration: PropTypes.number.isRequired,
  videoWidth: PropTypes.number.isRequired,
  eventColor: PropTypes.string.isRequired,
  isCurrentEventHappening: PropTypes.bool.isRequired,
  handleTimelineFiveClick: PropTypes.func.isRequired,
  setHighlightGraph: PropTypes.func.isRequired,
  setHighlightGraphBlock: PropTypes.func.isRequired,
};

export default EventBlockList;
