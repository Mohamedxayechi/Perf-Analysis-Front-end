// import { Displayable } from './Displayable ';

// export class ShapeDisplay implements Displayable {
//   label: string;
//   startTime: number;
//   endTime: number;
//   thumbnail: string;

//   constructor(
//     label: string,
//     startTime: number,
//     endTime: number,
//     thumbnail: string
//   ) {
//     this.label = label;
//     this.startTime = startTime;
//     this.endTime = endTime;
//     this.thumbnail = thumbnail;
//     console.log(`ShapeDisplay "${label}" created`);
//   }

//   play(): void {
//     console.log(`Playing shape ${this.label}`);
//   }

//   pause(): void {
//     console.log(`Pausing shape ${this.label}`);
//   }

//   delete(): void {
//     console.log(`Deleting shape ${this.label}`);
//   }

//   isVisibleAt(time: number): boolean {
//     return time >= this.startTime && time <= this.endTime;
//   }

//   setTiming(start: number, end: number): void {
//     this.startTime = start;
//     this.endTime = end;
//   }
// }
