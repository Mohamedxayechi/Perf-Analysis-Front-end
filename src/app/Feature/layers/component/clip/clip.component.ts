/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input } from '@angular/core';
import { Clip, Layer, Timeline } from '../../models/timeline.model';
import interact from 'interactjs';
import { Engine } from '../../../../Core/Engine';


@Component({
  selector: 'app-clip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clip.component.html',
  styleUrl: './clip.component.css',
})
export class ClipComponent implements AfterViewInit {
  @Input() clip!: Clip 
  @Input() distancePerTime: number = 50;
  @Input() layerHeight: number = 80;
  @Input() timeLine: Timeline=new Timeline();


    ngAfterViewInit(): void {
    interact('.draggable-clip').draggable({
      modifiers: [

        interact.modifiers.restrictRect({
          restriction: '.timeline-container',
          endOnly: true,
        }),
        interact.modifiers.restrictEdges({
          outer: {
            top: 0,
            left: 75.5,
            bottom: 0,
            right: 0,
          },
        }),
        
      ],
      listeners: {
        move: (event) => {
          const target = event.target;
          const x = parseFloat(target.getAttribute('data-x') || '0') + event.dx;
          const y = parseFloat(target.getAttribute('data-y') || '0') + event.dy;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute('data-x', x.toString());
          target.setAttribute('data-y', y.toString());
        },
        end: (event) => {

          const target = event.target;
          const id = target.getAttribute('data-id')!;

          const originalClip = this.timeLine.layers
            .flatMap((layer) => layer.clips)
            .find((clip) => clip.id === id);
          if (!originalClip) return;
          const x = parseFloat(target.getAttribute('data-x') || '0');
          const y = parseFloat(target.getAttribute('data-y') || '0');

          // Dynamically calculate the list and Y position
          const newLayerIndex = Math.max(Math.floor(y / this.layerHeight), 0); // Find which list based on Y position
          //  Out of bounds detection
          if (newLayerIndex >= this.timeLine.layers.length) {
            // Revert to original position
            this.revertToOriginalPosition(originalClip, target);
            console.log(
              'Out of bounds detection, reverting to original position'
            );
            return;
          }

          const newY = newLayerIndex * this.layerHeight; // Y position based on the layer index

          // Collision detection
          const allDraggables = Array.from(
            document.querySelectorAll('.draggable-clip')
          ) as HTMLElement[];

          const isColliding = this.isXCollidingInLayer(
            target,
            allDraggables,
            newLayerIndex
          );
          if (isColliding) {
            // Revert to original position
            this.revertToOriginalPosition(originalClip, target);
            console.log('Collision detection, reverting to original position');
          } else {
            // Snap to new Layer
            target.style.transform = `translate(${x}px, ${newY}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', newY.toString());
            target.setAttribute(
              'data-layer',
              this.getLayerFromClipId(originalClip.id)
            );
            // Update internal model
            //originalClip.startTime = x / this.distancePerTime; // x corresponds to time or position on timeline
            this.moveClip(id,newLayerIndex,x)
          }
        },
      },
      inertia: true,
    });
  }







  moveClip(clipId: string, newLayerIndex: number,startTime:number){

        Engine.getInstance().emit({
          type: 'timeLine.update',
          data: { id:clipId,index:newLayerIndex,startTime },
          origin: 'component',
          processed: false,
        });

  }

  getYFromLayerId(layerId: string): number {
    const index = this.timeLine.layers.findIndex(
      (layer) => layer.id === layerId
    );
    if (index === -1) return 0; // fallback if layer not found
    return index * this.layerHeight;
  }
  getTransformClip(clip: Clip, layerIndex: number): string {
    const x = clip.startTime * this.distancePerTime; // position on timeline
    const y = layerIndex * this.layerHeight; // vertical position per layer
    return `translate(${x}px, ${y}px)`;
  }

  getLayerFromClipId(clipId: string): Layer | undefined {
    return this.timeLine.layers.find((layer) =>
      layer.clips.some((clip) => clip.id === clipId)
    );
  }
  getYFromClipId(clipId: string): number {
    const layerIndex = this.timeLine.layers.findIndex((layer) =>
      layer.clips.some((clip) => clip.id === clipId)
    );
    return layerIndex !== -1 ? layerIndex * this.layerHeight : 0;
  }

  getLayerIndexFromCurrentClip(): number {
    const y = this.getYFromClipId(this.clip.id);
    return Math.max(Math.floor(y / this.layerHeight), 0);
  }

  revertToOriginalPosition(originalClip: Clip, target: HTMLElement) {
    // Revert to original position
    const revertY = this.getYFromClipId(originalClip.id);
    target.style.transform = `translate(${
      originalClip.startTime * this.distancePerTime
    }px, ${revertY}px)`;
    target.setAttribute(
      'data-x',
      (originalClip.startTime * this.distancePerTime).toString()
    );
    target.setAttribute('data-y', revertY.toString());
    const layer = this.getLayerFromClipId(originalClip.id);
    target.setAttribute('data-layer', layer ? layer.id : '');
  }

  isXCollidingInLayer(
    current: HTMLElement,
    all: HTMLElement[],
    layerIndex: number
  ): boolean {
    const currentRect = current.getBoundingClientRect();

    for (const other of all) {
      if (current === other) continue;
      const otherLayerIndex =
        parseFloat(other.getAttribute('data-y') || '0') / this.layerHeight;

      if (otherLayerIndex !== layerIndex) continue;

      const otherRect = other.getBoundingClientRect();

      const isOverlap =
        (otherRect.right > currentRect.left &&
          currentRect.left >= otherRect.left) ||
        (otherRect.right >= currentRect.right &&
          currentRect.right > otherRect.left)||
          (otherRect.right > currentRect.left &&
          currentRect.right >= otherRect.right)

      if (isOverlap) return true;
    }
    return false;
  }

}
