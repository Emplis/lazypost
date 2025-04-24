async function imageBlob2Bitmap(imageBlob, resizeWidthFactor) {
    const image = await createImageBitmap(imageBlob);

    const options = {
        resizeWidth: Math.floor(image.width / resizeWidthFactor),
        resizeQuality: "high",
    };

    const newImage = await createImageBitmap(image, options);

    return newImage;
}

async function imageBitmap2Blob(imageBitmap) {
    const ocanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    ocanvas.getContext("bitmaprenderer").transferFromImageBitmap(imageBitmap);
    const newImageBlob = await ocanvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });

    return newImageBlob;
}

async function resizeImage(imageBlob) {
    const maxSize = 2000000; // 2Mo

    // don't resize the first time, just convert to jpeg
    let imgBitmap = await imageBlob2Bitmap(imageBlob, 1);
    let img = await imageBitmap2Blob(imgBitmap);

    while (img.size > maxSize) {
        console.log("Image is too large, resizing it...");
        console.log(`Current size: ${img.size}B`);

        imgBitmap = await imageBlob2Bitmap(img, 2);
        img = await imageBitmap2Blob(imgBitmap);

        console.log("Resizing done.");
        console.log(`New size: ${img.size}B`);
    }

    return img;
}

function initializeImageResize() {
    const fileInput = document.getElementById("picture");

    fileInput.addEventListener("change", async () => {
        const files = fileInput.files;
        const alreadyResizing = fileInput.dataset.resizing == "true";

        if (!alreadyResizing && files.length == 1) {
            fileInput.disabled = true;

            const dt = new DataTransfer();

            const imageBlob = files[0];
            const resizedImgBlob = await resizeImage(imageBlob);

            const newFile = new File([resizedImgBlob], "postcard.jpeg", { type: "image/jpeg", });

            dt.items.add(newFile);

            fileInput.dataset.resizing = "true";
            fileInput.files = dt.files; // this will trigger a change event
        } else if (alreadyResizing) {
            fileInput.dataset.resizing = "false";
            fileInput.disabled = false;
        }
    });
}

window.addEventListener("load", () => {
    initializeImageResize();
});
