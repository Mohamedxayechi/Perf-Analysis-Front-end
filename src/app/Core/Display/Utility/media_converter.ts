import * as MP4Box from 'mp4box';
import { Media } from '../Models/media-model';
import { DisplayUtility } from './Displayutility';

export class MediaConverter {
  static async handleConvertToMP4(medias: Media[], updateDuration: (duration: number) => void, emitEvent: (event: any) => void): Promise<void> {
    console.log(`[${new Date().toISOString()}] MediaConverter: Handling convert to MP4`);
    const imageMedias = medias.filter(media => media.image && !media.isThumbnailOnly);
    if (!imageMedias.length) {
      console.warn(`[${new Date().toISOString()}] MediaConverter: No images to convert to MP4`);
      emitEvent({ type: 'Display.media.convertToMP4.completed', data: { updatedMedias: medias }, origin: 'domain' });
      return;
    }

    try {
      const { videoURL, duration, updatedMedias } = await this.convertImagesToMP4(imageMedias, medias);
      console.log(`[${new Date().toISOString()}] MediaConverter: MP4 conversion successful, duration: ${duration}, videoURL: ${videoURL}, updated medias: ${updatedMedias.length}`);

      DisplayUtility.initializeMedias(updatedMedias);
      updateDuration(DisplayUtility.getTotalTime());
      console.log(`[${new Date().toISOString()}] MediaConverter: Media list updated after MP4 conversion`, { count: updatedMedias.length });

      emitEvent({
        type: 'Display.media.convertToMP4.completed',
        data: { updatedMedias, videoURL },
        origin: 'domain',
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] MediaConverter: Error during MP4 conversion: ${error instanceof Error ? error.message : String(error)}`);
      emitEvent({
        type: 'Display.media.convertToMP4.failed',
        data: { error: error instanceof Error ? error.message : String(error) },
        origin: 'domain',
      });
    }
  }

  private static async convertImagesToMP4(imageMedias: Media[], allMedias: Media[]): Promise<{ videoURL: string; duration: number; updatedMedias: Media[] }> {
    const mp4box = MP4Box.createFile();
    let trackId: number;
    let totalDuration = 0;
    const FPS = 30;
    const timescale = 1000;

    for (const [index, media] of imageMedias.entries()) {
      if (!media.image) continue;
      const duration = ((media.endTime ?? media.time ?? 5) - (media.startTime ?? 0)) * timescale;
      totalDuration += duration;

      const image = new Image();
      image.src = media.image;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`Failed to load image: ${media.image}`));
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);

      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      if (index === 0) {
        trackId = mp4box.addTrack({
          timescale,
          width: canvas.width,
          height: canvas.height,
          avcDecoderConfigRecord: null,
        });
      }

      const sample = {
        data: frameData.buffer,
        size: frameData.length,
        duration,
        cts: totalDuration - duration,
        dts: totalDuration - duration,
        is_sync: true,
      };
      mp4box.addSample(trackId!, sample);
    }

    mp4box.setSegmentOptions(trackId!, null, { nbSamples: 1000 });

    const buffer = await new Promise<Uint8Array>((resolve) => {
      const chunks: Uint8Array[] = [];
      mp4box.onSegment = (id: number, user: any, buffer: ArrayBuffer, sampleNumber: number, last: boolean) => {
        chunks.push(new Uint8Array(buffer));
        if (last) {
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(result);
        }
      };
      mp4box.start();
    });

    const blob = new Blob([buffer], { type: 'video/mp4' });
    const videoURL = URL.createObjectURL(blob);

    const newMedia: Media = {
      video: videoURL,
      time: totalDuration / timescale,
      label: 'Converted_Video.mp4',
      thumbnail: imageMedias[0].thumbnail || imageMedias[0].image!,
      startTime: 0,
      endTime: totalDuration / timescale,
      isThumbnailOnly: false,
    };

    const firstImageIndex = allMedias.findIndex(media => media.image && !media.isThumbnailOnly);
    const updatedMedias = [
      ...allMedias.slice(0, firstImageIndex),
      newMedia,
      ...allMedias.slice(firstImageIndex + imageMedias.length).map(media => ({
        ...media,
        startTime: (media.startTime ?? 0) + (totalDuration / timescale) - imageMedias.reduce((sum, m) => sum + ((m.endTime ?? m.time ?? 0) - (m.startTime ?? 0)), 0),
        endTime: (media.endTime ?? media.time ?? 0) + (totalDuration / timescale) - imageMedias.reduce((sum, m) => sum + ((m.endTime ?? m.time ?? 0) - (m.startTime ?? 0)), 0),
      })),
    ];

    return { videoURL, duration: totalDuration / timescale, updatedMedias };
  }
}