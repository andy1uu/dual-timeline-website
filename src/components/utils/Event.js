import React, { useState } from "react";
import { convertSecondsToTime } from "@/utils/HelperFunctions";
import ImageZoom from "react-image-zooom";

const Event = ({
  eventBlockEvent,
  zoomAmount,
  eventColor,
  selectedVideo,
  handleTimelineFiveClick,
  setOpen
}) => {
  const [clicked, setClicked] = useState(false);

  return (
    <div
      key={eventBlockEvent.currentEventID}
      style={{ backgroundColor: `${eventColor}` }}
      className={`flex w-80 flex-col rounded-xl p-2 ${clicked ? "opacity-50" : ""}`}>
      <ImageZoom
        src={`/images/${selectedVideo.label}/${eventBlockEvent.currentEventVideoName}_${eventBlockEvent.currentEventID}.png`}
        width={288}
        height={300}
        alt={`${eventBlockEvent.currentEventVideoName}_${eventBlockEvent.currentEventID}`}
        className="!mx-auto !my-2 rounded-xl"
        zoom={zoomAmount.value}
      />
      <button
        onClick={() => {
          setOpen(false);
          setClicked(true);
          handleTimelineFiveClick(eventBlockEvent);
        }}
        className="mx-auto flex w-72 flex-col">
        <p className="w-72 text-wrap">{eventBlockEvent.currentEventName}</p>
        <p className="w-72 text-wrap">
          {"Time: " +
            convertSecondsToTime(
              eventBlockEvent.currentEventStartFrameSeconds,
            ) +
            " - " +
            convertSecondsToTime(eventBlockEvent.currentEventEndFrameSeconds)}
        </p>
      </button>
    </div>
  );
};

export default Event;
