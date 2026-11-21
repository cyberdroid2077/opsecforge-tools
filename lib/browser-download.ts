/** Saves bytes or text as a file from the current page through a temporary object URL. Nothing is sent anywhere. */
export function downloadFromPage(content: BlobPart, fileName: string, mediaType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mediaType }));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
