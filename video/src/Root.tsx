import "./index.css";
import { MyComposition } from "./Composition";
import { JoinedVideoComposition } from "./JoinedVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <JoinedVideoComposition />
    </>
  );
};
