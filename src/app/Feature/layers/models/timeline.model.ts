
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

  addLayer(layer: Layer) {
    this.layers.push(layer);
  }
}


