import React, { useState, useRef, useEffect } from "react";

const clickOutside = (WrappedComponent) => {
  const Component = ({
    eventBlock,
    totalDuration,
    videoWidth,
    eventColor,
    isCurrentEventHappening,
    selectedVideo,
    handleTimelineFiveClick,
  }) => {
    const [open, setOpen] = useState(false);

    const ref = useRef();

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (!ref.current.contains(event.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
      <WrappedComponent
        open={open}
        setOpen={setOpen}
        ref={ref}
        eventBlock={eventBlock}
        totalDuration={totalDuration}
        videoWidth={videoWidth}
        eventColor={eventColor}
        isCurrentEventHappening={isCurrentEventHappening}
        selectedVideo={selectedVideo}
        handleTimelineFiveClick={handleTimelineFiveClick}
      />
    );
  };

  return Component;
};

export default clickOutside;
