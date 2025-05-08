export interface Media {
  label: string;
  time: number;
  thumbnail: string;
  video?: string;
  image?: string; 
  startTime?: number;
  endTime?: number; 
}

export const EXTERNAL_TIME_PERIODS: Media[] = [
  {
    label: 'Bronze age',
    time: 2,
    thumbnail:
      '/assets/thumbnails/1.png',
    video: '/assets/videos/1.mp4',
  },
  {
    label: 'Iron age',
    time: 3,
    thumbnail:
      '/assets/thumbnails/2.png',
    image: '/assets/thumbnails/2.png',

  },
  {
    label: 'Middle ages',
    time: 3,
    thumbnail:
      '/assets/thumbnails/3.png',
    video: '/assets/videos/3.mp4',
  },
  {
    label: 'Early modern period',
    time: 6,
    thumbnail:
      '/assets/thumbnails/4.png',
    video: '/assets/videos/4.mp4',
  },
  {
    label: 'Long nineteenth century',
    time: 8,
    thumbnail:
      '/assets/thumbnails/5.png',
    video: '/assets/videos/5.mp4',
  },
  {
    label: 'last',
    time: 3,
    thumbnail:
      '/assets/thumbnails/6.png',
    video: '/assets/videos/6.mp4',
  },


];
