import { v4 as uuidv4 } from 'uuid';
export type ClipType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'SHAPE';

export interface MediaData {
  url: string;
  name: string;
  type: ClipType;
}

export interface ClipProperties {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export class Clip {
  id: string;
  startTime!: number;
  duration!: number;
  source!: MediaData;
  properties!: ClipProperties;

  constructor(
    startTime: number,
    duration: number,
    source: MediaData,
    properties: ClipProperties,
    id?: string
  ) {
    this.id = id ?? uuidv4();
    this.startTime = startTime;
    this.duration = duration;
    this.source = source;
    this.properties = properties;
  }

  static isColliding(clipA: Clip, clipB: Clip): boolean {
    const startA = clipA.startTime;
    const endA = clipA.startTime + clipA.duration;
    const startB = clipB.startTime;
    const endB = clipB.startTime + clipB.duration;

    return (
      (startA >= startB && startA < endB) ||
      (endA > startB && endA <= endB) ||
      (startB > startA && startB < endA)
    );
  }
}

export interface LayerProperties {
  visible: boolean;
  locked: boolean;
}

export class Layer {
  id: string;
  clips: Clip[] = [];
  properties: LayerProperties;

  constructor(properties?: Partial<LayerProperties>, id?: string) {
    this.id = id ?? uuidv4();
    this.properties = {
      visible: true,
      locked: false,
      ...properties,
    };
  }

  addClip(clip: Clip) {
    this.clips.push(clip);
  }
}

export type PlaybackState = 'PLAYING' | 'PAUSED';
export class Timeline {
  id: string;
  layers: Layer[] = [];
  totalDuration = 0;
  currentTime = 0;
  playbackState: PlaybackState = 'PAUSED';

  constructor(
    totalDuration = 0,
    currentTime = 0,
    playbackState: PlaybackState = 'PAUSED',
    id?: string
  ) {
    this.id = id ?? uuidv4();
    this.totalDuration = totalDuration;
    this.currentTime = currentTime;
    this.playbackState = playbackState;
  }

  updateClipLayer(
    clipId: string,
    newLayerId: string,
    newStartTime: number
  ): boolean {
    // Find the current layer that contains the clip
    const currentLayer = this.layers.find((layer) =>
      layer.clips.some((clip) => clip.id === clipId)
    );

    if (!currentLayer) {
      console.error('Clip not found in any layer');
      return false;
    }

    const clipIndex = currentLayer.clips.findIndex(
      (clip) => clip.id === clipId
    );
    if (clipIndex === -1) return false;

    // Remove clip from current layer
    const [clip] = currentLayer.clips.splice(clipIndex, 1);

    // Find target layer
    const newLayer = this.layers.find((layer) => layer.id === newLayerId);
    if (!newLayer) {
      console.error('Target layer does not exist');
      // Optionally: push it back to original layer if needed
      currentLayer.clips.splice(clipIndex, 0, clip);
      return false;
    }

    // Update clip and add to new layer
    clip.startTime = newStartTime;
    newLayer.clips.push(clip);

    // Clean up empty layers if needed
    this.layers = this.layers.filter((layer) => layer.clips.length > 0);

    return true;
  }
  adjustClipLayers(): void {
    const visibleLayers = this.layers.filter(
      (layer) => layer.properties.visible
    );

    for (
      let currentLayerIndex = 1;
      currentLayerIndex < visibleLayers.length;
      currentLayerIndex++
    ) {
      const currentLayer = visibleLayers[currentLayerIndex];

      for (
        let clipIndex = currentLayer.clips.length - 1;
        clipIndex >= 0;
        clipIndex--
      ) {
        const clip = currentLayer.clips[clipIndex];
        let highestLayerIndex = currentLayerIndex;

        for (
          let targetLayerIndex = currentLayerIndex - 1;
          targetLayerIndex >= 0;
          targetLayerIndex--
        ) {
          const targetLayer = visibleLayers[targetLayerIndex];
          const hasCollision = targetLayer.clips.some((targetClip) =>
            Clip.isColliding(clip, targetClip)
          );

          if (!hasCollision) {
            highestLayerIndex = targetLayerIndex;
          } else {
            break;
          }
        }

        if (highestLayerIndex < currentLayerIndex) {
          currentLayer.clips.splice(clipIndex, 1);
          visibleLayers[highestLayerIndex].clips.push(clip);
        }
      }
    }

    this.layers = this.layers.filter((layer) => layer.clips.length > 0);
  }

  addLayer(layer: Layer) {
    this.layers.push(layer);
  }
}
