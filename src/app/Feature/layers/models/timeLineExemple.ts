import { Clip,Layer,Timeline } from "./timeline.model";

const clip1 = new Clip(
  0,
  10,
  { url: 'https://example.com/video1.mp4', name: 'Video Clip 1', type: 'VIDEO' },
  { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }
);

const clip2 = new Clip(
  1,
  5,
  { url: 'https://example.com/image1.png', name: 'Image Clip 1', type: 'IMAGE' },
  { x: 10, y: 20, scale: 0.8, rotation: 15, opacity: 0.9 }
);

const clip3 = new Clip(
  5,
  7,
  { url: 'https://example.com/text1.txt', name: 'Text Clip 1', type: 'TEXT' },
  { x: 50, y: 50, scale: 1, rotation: 0, opacity: 1 }
);

const clip4 = new Clip(
  5,
  8,
  { url: 'https://example.com/shape1.svg', name: 'Shape Clip 1', type: 'SHAPE' },
  { x: 5, y: 5, scale: 1.5, rotation: 45, opacity: 0.7 }
);

const clip5 = new Clip(
  2,
  6,
  { url: 'https://example.com/video2.mp4', name: 'Video Clip 2', type: 'VIDEO' },
  { x: 15, y: 15, scale: 1, rotation: 90, opacity: 0.5 }
);
const clip6 = new Clip(
  9,
  4,
  { url: 'https://example.com/image2.png', name: 'Image Clip 2', type: 'IMAGE' },
  { x: 30, y: 10, scale: 1.2, rotation: 10, opacity: 0.85 }
);

const clip7 = new Clip(
  8,
  9,
  { url: 'https://example.com/video3.mp4', name: 'Video Clip 3', type: 'VIDEO' },
  { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }
);

const clip8 = new Clip(
  7.5,
  3,
  { url: 'https://example.com/text2.txt', name: 'Text Clip 2', type: 'TEXT' },
  { x: 60, y: 40, scale: 0.9, rotation: 5, opacity: 0.95 }
);

const clip9 = new Clip(
  4.3,
  5,
  { url: 'https://example.com/shape2.svg', name: 'Shape Clip 2', type: 'SHAPE' },
  { x: 20, y: 25, scale: 1, rotation: 30, opacity: 0.6 }
);

const clip10 = new Clip(
  3,
  7,
  { url: 'https://example.com/image3.png', name: 'Image Clip 3', type: 'IMAGE' },
  { x: 12, y: 18, scale: 1.1, rotation: 0, opacity: 0.9 }
);
const layer1 = new Layer({ visible: true, locked: false });
layer1.addClip(clip1);
layer1.addClip(clip6)

const layer2 = new Layer({ visible: true, locked: false });
layer2.addClip(clip2);
layer2.addClip(clip3);
layer2.addClip(clip8)
const layer3 = new Layer({ visible: false, locked: true });
layer3.addClip(clip4);

const layer4 = new Layer({ visible: true, locked: false });
layer4.addClip(clip5);
layer4.addClip(clip9);

const layer5 = new Layer({ visible: true, locked: false });
layer5.addClip(clip7);
layer5.addClip(clip10);

export  const timeline = new Timeline();
timeline.totalDuration = 30;
timeline.currentTime = 0;
timeline.playbackState = 'PAUSED';

timeline.addLayer(layer1);
timeline.addLayer(layer2);
timeline.addLayer(layer3);
timeline.addLayer(layer4);
timeline.addLayer(layer5);


