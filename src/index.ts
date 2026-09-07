import "dotenv/config";
import app from "./app";
import Logger from "./lib/logger";

const PORT = 3000;

// Start server
app.listen(PORT, () => {
	Logger.info(`🚀 Server running on http://localhost:${PORT}`);
	Logger.info(`📝 Try: http://localhost:${PORT}/health`);
});
