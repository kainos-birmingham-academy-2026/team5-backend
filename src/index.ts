import app from "./app";
const PORT = 3000;

// Start server
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	console.log(`📝 Try: http://localhost:${PORT}/health`);
});
