import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "node:crypto";

const FILE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
	"application/pdf": "pdf",
	"application/msword": "doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		"docx",
};

export interface CvBlobStorageClient {
	uploadCv(
		cvData: Buffer,
		applicantId: string,
		cvMimeType: string,
	): Promise<string>;
	deleteCv(blobName: string): Promise<void>;
}

export class AzureBlobStorageConfigurationError extends Error {}

export class AzureBlobStorageClient implements CvBlobStorageClient {
	private blobServiceClient?: BlobServiceClient;

	async uploadCv(
		cvData: Buffer,
		applicantId: string,
		cvMimeType: string,
	): Promise<string> {
		const fileExtension = FILE_EXTENSION_BY_MIME_TYPE[cvMimeType];
		if (!fileExtension) {
			throw new Error("Unsupported CV MIME type");
		}

		const blobName = `applications/${applicantId}/${randomUUID()}.${fileExtension}`;
		const blockBlobClient = this.getContainerClient().getBlockBlobClient(blobName);
		await blockBlobClient.uploadData(cvData, {
			blobHTTPHeaders: { blobContentType: cvMimeType },
		});

		return blobName;
	}

	async deleteCv(blobName: string): Promise<void> {
		await this.getContainerClient().deleteBlob(blobName, {
			deleteSnapshots: "include",
		});
	}

	private getContainerClient() {
		const storageAccountName = this.getRequiredEnvironmentVariable(
			"AZURE_STORAGE_ACCOUNT_NAME",
		);
		const containerName = this.getRequiredEnvironmentVariable(
			"CV_QUARANTINE_CONTAINER",
		);

		if (!this.blobServiceClient) {
			this.blobServiceClient = new BlobServiceClient(
				`https://${storageAccountName}.blob.core.windows.net`,
				new DefaultAzureCredential(),
			);
		}

		return this.blobServiceClient.getContainerClient(containerName);
	}

	private getRequiredEnvironmentVariable(name: string): string {
		const value = process.env[name]?.trim();
		if (!value) {
			throw new AzureBlobStorageConfigurationError(
				`${name} is not configured`,
			);
		}

		return value;
	}
}