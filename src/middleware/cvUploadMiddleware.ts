import multer from "multer";

const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV_MIME_TYPES = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const cvUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_CV_SIZE_BYTES },
	fileFilter: (_req, file, callback) => {
		if (!ALLOWED_CV_MIME_TYPES.has(file.mimetype)) {
			callback(new Error("CV must be a PDF, DOC, or DOCX file"));
			return;
		}

		callback(null, true);
	},
});