import pica from "pica";

export default function resizeImageWithPica(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event: ProgressEvent<FileReader>) {
      const img = new Image();
      img.src = event.target!.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width = Math.round((width *= maxHeight / height));
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Use Pica to resize the image
        pica()
          .resize(img, canvas, {
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2,
          })
          .then((result) => pica().toBlob(result, "image/jpeg", 0.9))
          .then((blob) =>
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              }),
            ),
          )
          .catch(reject);
      };
      img.onerror = () => reject(new Error("Image loading error"));
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}
