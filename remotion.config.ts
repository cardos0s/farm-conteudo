import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
