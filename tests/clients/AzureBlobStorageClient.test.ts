import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const azureMocks = vi.hoisted(() => ({
	deleteBlob: vi.fn(),
	getBlockBlobClient: vi.fn(),
	getContainerClient: vi.fn(),
	uploadData: vi.fn(),
}));

vi.mock("@azure/identity", () => ({
	DefaultAzureCredential: vi.fn(),
}));

vi.mock("@azure/storage-blob", () => ({
	BlobServiceClient: vi.fn(function BlobServiceClientMock() {
		return { getContainerClient: azureMocks.getContainerClient };
	}),
}));

import {
	AzureBlobStorageClient,
	AzureBlobStorageConfigurationError,
} from "../../src/clients/AzureBlobStorageClient";

describe("AzureBlobStorageClient", () => {
	const originalStorageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
	const originalContainerName = process.env.CV_QUARANTINE_CONTAINER;

	beforeEach(() => {
		vi.resetAllMocks();
		process.env.AZURE_STORAGE_ACCOUNT_NAME = "cvstorage";
		process.env.CV_QUARANTINE_CONTAINER = "cv-quarantine";
		azureMocks.getContainerClient.mockReturnValue({
			getBlockBlobClient: azureMocks.getBlockBlobClient,
			deleteBlob: azureMocks.deleteBlob,
		});
		azureMocks.getBlockBlobClient.mockReturnValue({
			uploadData: azureMocks.uploadData,
		});
		azureMocks.uploadData.mockResolvedValue(undefined);
		azureMocks.deleteBlob.mockResolvedValue(undefined);
	});

	afterEach(() => {
		if (originalStorageAccountName === undefined) {
			delete process.env.AZURE_STORAGE_ACCOUNT_NAME;
		} else {
			process.env.AZURE_STORAGE_ACCOUNT_NAME = originalStorageAccountName;
		}

		if (originalContainerName === undefined) {
			delete process.env.CV_QUARANTINE_CONTAINER;
		} else {
			process.env.CV_QUARANTINE_CONTAINER = originalContainerName;
		}
	});

	it("uploads a PDF to the quarantine container", async () => {
		const cvData = Buffer.from("cv-content");

		const blobName = await new AzureBlobStorageClient().uploadCv(
			cvData,
			"applicant-1",
			"application/pdf",
		);

		expect(blobName).toMatch(/^applications\/applicant-1\/.+\.pdf$/);
		expect(azureMocks.getContainerClient).toHaveBeenCalledWith("cv-quarantine");
		expect(azureMocks.getBlockBlobClient).toHaveBeenCalledWith(blobName);
		expect(azureMocks.uploadData).toHaveBeenCalledWith(cvData, {
			blobHTTPHeaders: { blobContentType: "application/pdf" },
		});
	});

	it("deletes a Blob including its snapshots", async () => {
		await new AzureBlobStorageClient().deleteCv(
			"applications/applicant-1/cv.pdf",
		);

		expect(azureMocks.deleteBlob).toHaveBeenCalledWith(
			"applications/applicant-1/cv.pdf",
			{ deleteSnapshots: "include" },
		);
	});

	it("rejects unsupported CV MIME types before accessing storage", async () => {
		await expect(
			new AzureBlobStorageClient().uploadCv(
				Buffer.from("cv-content"),
				"applicant-1",
				"text/plain",
			),
		).rejects.toThrow("Unsupported CV MIME type");

		expect(azureMocks.getContainerClient).not.toHaveBeenCalled();
	});

	it("requires the Azure storage account name", async () => {
		delete process.env.AZURE_STORAGE_ACCOUNT_NAME;

		await expect(
			new AzureBlobStorageClient().deleteCv("applications/applicant-1/cv.pdf"),
		).rejects.toThrow(AzureBlobStorageConfigurationError);
	});

	it("requires the quarantine container name", async () => {
		delete process.env.CV_QUARANTINE_CONTAINER;

		await expect(
			new AzureBlobStorageClient().deleteCv("applications/applicant-1/cv.pdf"),
		).rejects.toThrow(AzureBlobStorageConfigurationError);
	});
});
