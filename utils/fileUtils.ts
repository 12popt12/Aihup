export interface ImageDetails {
  url: string;
  base64: string;
  mimeType: string;
}

export const processFile = (file: File): Promise<ImageDetails> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file.'));
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({
        url: dataUrl,
        base64,
        mimeType: file.type,
      });
    };
    reader.onerror = (error) => reject(error);
  });
};