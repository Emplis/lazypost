function initializeImageResize() {
    const maxSize = 2000000; // 2Mo
    const maxHeightWidth = 10000;
    const fileInput = document.getElementById("picture");

    const imageWorker = new Worker("assets/scripts/imageWorker.js");

    let toastId = null;

    fileInput.addEventListener("change", async () => {
        const files = fileInput.files;

        if (files.length == 1) {
            const imageBlob = files[0];

            if (imageBlob.size > maxSize) {
                const toastText = "Trying to resize your image";

                fileInput.disabled = true;
                fileInput.dataset.state = "processing";

                toastId = window.toaster.push(toastText, true, 0);

                // convert the blob to bitmap
                // so we can check it's width/height
                // to avoid running out of memory when resizing if the image is too large
                imageWorker.postMessage({
                    type: "blob2bitmap",
                    blob: imageBlob,
                });
            }
        }
    });

    imageWorker.addEventListener("message", (e) => {
        const data = e.data;

        if (data.type == "resizedImage") {
            const dt = new DataTransfer();

            const resizedImageBlob = data.resizedImageBlob;
            const newFile = new File([resizedImageBlob], "postcard.jpeg", { type: "image/jpeg", });

            dt.items.add(newFile);
            fileInput.files = dt.files; // WARN: this *may* trigger a change event
            // if that happen we should keep a state of the first real change

            fileInput.disabled = false;
            fileInput.dataset.state = "done";

            window.toaster.clear(toastId);
        } else if (data.type == "bitmapImage") {
            const bitmapImage = data.bitmap;

            if (bitmapImage.width < maxHeightWidth && bitmapImage.height < maxHeightWidth) {
                imageWorker.postMessage({
                    type: "resize",
                    maxSize,
                    bitmap: bitmapImage,
                });
            } else {
                fileInput.disabled = false;
                fileInput.dataset.state = "aborted";

                window.toaster.clear(toastId);

                // remove selected file
                fileInput.value = null;

                const toastText = "Image is too large.";
                window.toaster.push(toastText, false, 2500);
            }
        } else if (data.type == "blobImage") {
            console.log("ImageWorker sent blobImage.");
        } else {
            throw new Error("Unexpected message from ImageWorker.");
        }
    });
}

window.addEventListener("load", () => {
    initializeImageResize();
});
