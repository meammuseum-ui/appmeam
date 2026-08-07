import React from "react";
import {
  CalculateMetadataFunction,
  Composition,
  OffthreadVideo,
  Series,
  staticFile,
} from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { clips } from "./clips";
import { ClipCaptions } from "./Subtitles";

const FPS = 30;

type Props = {
  clipDurationsInFrames: number[];
};

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const clipDurationsInFrames = await Promise.all(
    clips.map(async (clip) => {
      const { durationInSeconds } = await getVideoMetadata(
        staticFile(`videos/${clip.fileName}`),
      );
      return Math.round(durationInSeconds * FPS);
    }),
  );

  const durationInFrames =
    clipDurationsInFrames.reduce((sum, frames) => sum + frames, 0) || FPS;

  return {
    durationInFrames,
    props: { clipDurationsInFrames },
  };
};

export const JoinedVideoComposition = () => {
  return (
    <Composition
      id="JoinedVideo"
      component={JoinedVideo}
      fps={FPS}
      width={1920}
      height={1080}
      // Overridden by calculateMetadata once the real clip durations are known.
      durationInFrames={FPS}
      defaultProps={{ clipDurationsInFrames: [] }}
      calculateMetadata={calculateMetadata}
    />
  );
};

export const JoinedVideo: React.FC<Props> = ({ clipDurationsInFrames }) => {
  return (
    <Series>
      {clips.map((clip, i) => (
        <Series.Sequence
          key={clip.fileName}
          durationInFrames={clipDurationsInFrames[i] ?? FPS}
        >
          <OffthreadVideo src={staticFile(`videos/${clip.fileName}`)} />
          {clip.captionsFile ? (
            <ClipCaptions captionsFile={clip.captionsFile} />
          ) : null}
        </Series.Sequence>
      ))}
    </Series>
  );
};
