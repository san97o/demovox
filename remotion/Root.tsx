import { Composition, registerRoot } from "remotion";
import {
  ProductDemo,
  type ProductDemoProps,
} from "./compositions/ProductDemo";

const DEFAULT_PROPS: ProductDemoProps = {
  title: "My Product",
  tagline: "The tagline goes here.",
  screenshots: [],
  voiceover_url: "",
  accent_color: "#00e128",
};

function Root() {
  return (
    <Composition
      id="ProductDemo"
      component={ProductDemo}
      durationInFrames={900}
      fps={30}
      width={1280}
      height={720}
      defaultProps={DEFAULT_PROPS}
    />
  );
}

registerRoot(Root);
