export const convertSecondsToTime = (sec) => {
  const dateObj = new Date(sec * 1000);
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = dateObj.getSeconds();
  const timeString =
    (hours != 0 ? hours.toString().padStart(2, "0") + ":" : "") +
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0");
  return timeString;
};

export const heightConverter = (sizeToConvert, height, videoHeight) => {
  if (height !== videoHeight) {
    return (sizeToConvert / height) * videoHeight;
  }
  return sizeToConvert;
};

export const widthConverter = (sizeToConvert, width, videoWidth) => {
  if (width !== videoWidth) {
    return (sizeToConvert / width) * videoWidth;
  }
  return sizeToConvert;
};

export const timelineEventFilterer = (selectedEventType, videoEvents) => {
  return selectedEventType.label.slice(0, 2) !== "0:"
    ? videoEvents.filter(({ currentEventName }) => {
        return (
          currentEventName.slice(0, 2) === selectedEventType.label.slice(0, 2)
        );
      })
    : videoEvents.sort(
        (a, b) =>
          parseFloat(a.currentEventStartFrameSeconds) -
          parseFloat(b.currentEventStartFrameSeconds),
      );
};

export const playPauseHandler = (videoState, setVideoState) => {
  setVideoState({ ...videoState, playing: !videoState.playing });
};

export const rewindHandler = (videoPlayerRef) => {
  //Rewinds the video player reducing 10
  videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() - 10);
};

export const fastFowardHandler = (videoPlayerRef) => {
  //FastFowards the video player by adding 10
  videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() + 10);
};

export const eventColorFinder = (eventTypeNumber) => {
  switch (eventTypeNumber) {
    case 1:
      return "red";
    case 2:
      return "orange";
    case 3:
      return "yellow";
    case 4:
      return "amber";
    case 5:
      return "emerald";
    case 6:
      return "teal";
    case 7:
      return "blue";
    case 8:
      return "indigo";
    case 9:
      return "violet";
    case 10:
      return "bpurple";
    case 11:
      return "pink";
    case 12:
      return "rose";
    default:
      return "zinc";
  }
};
