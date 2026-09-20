export interface LocalDownloadArtifact {
  readonly blob: Blob;
  readonly fileName: string;
}

export function downloadLocalArtifact(artifact: LocalDownloadArtifact): void {
  const downloadUrl = URL.createObjectURL(artifact.blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = artifact.fileName;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}
