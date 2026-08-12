import morgan, { type StreamOptions } from "morgan";
import Logger from "../lib/logger";

// Route Morgan output through Winston's http level
const stream: StreamOptions = {
	write: (message) => Logger.http(message),
};

const morganMiddleware = morgan(
	":method :url :status :res[content-length] - :response-time ms",
	{ stream },
);

export default morganMiddleware;
