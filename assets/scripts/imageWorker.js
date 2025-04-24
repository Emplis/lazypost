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

async function resizeImage(imageBitmap, maxSize) {
    let blob = await imageBitmap2Blob(imageBitmap);

    while (blob.size > maxSize) {
        console.log("Image is too large, resizing it...");
        console.log(`Current size: ${blob.size}B`);

        const bitmap = await imageBlob2Bitmap(blob, 2);
        blob = await imageBitmap2Blob(bitmap);

        console.log("Resizing done.");
        console.log(`New size: ${blob.size}B`);
    }

    return blob;
}

self.onmessage = async (e) => {
    const data = e.data;

    console.log("ImageWorker: Received Message");
    console.log(data);

    if (data.type == "resize") {
        const bitmap = data.bitmap;
        const maxSize = data.maxSize;

        const resizedImageBlob = await resizeImage(bitmap, maxSize);

        self.postMessage({
            type: "resizedImage",
            resizedImageBlob,
        });
    } else if (data.type == "blob2bitmap") {
        const blob = data.blob;

        const bitmap = await imageBlob2Bitmap(blob, 1);

        self.postMessage({
            type: "bitmapImage",
            bitmap,
        });
    } else if (data.type == "bitmap2blob") {
        const bitmap = data.bitmap;

        const blob = await imageBitmap2Blob(bitmap);

        self.postMessage({
            type: "blobImage",
            blob,
        });
    } else {
        throw new Error(`ImageWorker received an unexpected message. (${e})`);
    }
};
