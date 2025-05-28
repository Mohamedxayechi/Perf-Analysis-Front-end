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
  @Input() clip!: Clip;
  @Input() distancePerTime: number = 50;
  @Input() layerHeight: number = 80;
  @Input() timeLine: Timeline = new Timeline();
  @Input() layerIndex = 0;
  @Input()
  visibleLayers: Layer[] = [];
  private newX=0

  ngAfterViewInit(): void {
    interact('.draggable-clip')
      .draggable({
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: '.timeline-container',
            endOnly: true,
          }),
          interact.modifiers.restrictEdges({
            outer: {
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            },
          }),
        ],
        listeners: {
          move: (event) => {
            const target = event.target;
            const x =
              parseFloat(target.getAttribute('data-x') || '0') + event.dx;
            const y =
              parseFloat(target.getAttribute('data-y') || '0') + event.dy;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
          },
          end: (event) => {
            const target = event.target;
            const id = target.getAttribute('data-id')!;

            const originalClip = this.visibleLayers
              .flatMap((layer) => layer.clips)
              .find((clip) => clip.id === id);
            if (!originalClip) return;
            let x = parseFloat(target.getAttribute('data-x') || '0');
            const y = parseFloat(target.getAttribute('data-y') || '0');

            if (x < 0) {
              x = 0;
              console.log(
                'Time should be great than 0, reverting to original position'
              );
            }

            // Dynamically calculate the list and Y position
            const newLayerIndex = Math.max(Math.floor(y / this.layerHeight), 0); // Find which list based on Y position
            //  Out of bounds detection
            if (newLayerIndex >= this.visibleLayers!.length) {
              // Revert to original position

              console.log(
                'Out of bounds detection, reverting to original position'
              );
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
              console.log(
                'Collision detection, reverting to original position'
              );
            } else {
              const newLayerId = this.visibleLayers[newLayerIndex].id;
              // Update internal model
              this.moveClip(id, newLayerId, x / this.distancePerTime);
              // Snap to new Layer
              target.style.transform = `translate(${x}px, ${newY}px)`;
              target.setAttribute('data-x', x.toString());
              target.setAttribute('data-y', newY.toString());
              target.setAttribute(
                'data-layer',
                this.getLayerFromClipId(originalClip.id)
              );
            }
          },
        },
        inertia: true,
      })
      .resizable({
        edges: { left: true, right: true, top: false, bottom: false },
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: '.timeline-container',
            endOnly: true,
          }),
        ],
        listeners: {
          move: (event) => {
            const target = event.target as HTMLElement;

            const x = parseFloat(target.getAttribute('data-x') || '0') || 0;

            // Apply the new width visually

            this.newX = x + event.deltaRect.left;
            const newWidth = event.rect.width;

            target.style.width = `${newWidth}px`;

            // If resizing from left, shift the element visually to maintain position
            if (event.deltaRect.left !== 0) {
              const newX = x + event.deltaRect.left;
              target.style.transform = `translate(${newX}px, ${target.getAttribute(
                'data-y'
              )}px)`;
              target.setAttribute('data-x', newX.toString());
            }
          },
          end: (event) => {
            const edge = event.edges.left ? 'left' : 'right';
            const target = event.target as HTMLElement;
            const id = target.getAttribute('data-id');
            if (!id) return;

            let newWidth = event.rect.width;
            if(this.newX<0)
              newWidth=newWidth+this.newX
            const newX = parseFloat(target.getAttribute('data-x') || '0');

            const clip = this.timeLine.layers
              .flatMap((layer) => layer.clips)
              .find((c) => c.id === id);
            if (!clip) return;

            // Calculate new duration and startTime
            const newDuration = newWidth / this.distancePerTime;
            const newStartTime = newX / this.distancePerTime;

            //this.moveClip(id, this.getLayerIndexFromCurrentClip(), newX);

            // Optional: Emit full clip update
            this.resizeClip(id, newDuration, newStartTime, edge);
            target.style.width = clip.duration * this.distancePerTime + 'px';
            const x = clip.startTime * this.distancePerTime;
            const y = this.layerIndex * this.layerHeight;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
          },
        },
      });
  }

  resizeClip(
    clipId: string,
    duration: number,
    startTime: number,
    edge: string
  ) {
    Engine.getInstance().emit({
      type: 'timeLine.resize',
      data: { id: clipId, duration, startTime, edge },
      origin: 'component',
      processed: false,
    });
  }

  moveClip(clipId: string, newLayerIndex: string, startTime: number) {
    Engine.getInstance().emit({
      type: 'timeLine.update',
      data: { id: clipId, index: newLayerIndex, startTime },
      origin: 'component',
      processed: false,
    });
  }

  getYFromLayerId(layerId: string): number {
    const index = this.visibleLayers!.findIndex(
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
    return this.visibleLayers!.find((layer) =>
      layer.clips.some((clip) => clip.id === clipId)
    );
  }
  getYFromClipId(clipId: string): number {
    const layerIndex = this.visibleLayers!.findIndex((layer) =>
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
    others: HTMLElement[],
    layerIndex: number
  ): boolean {
    const currentRect = current.getBoundingClientRect();

    for (const other of others) {
      if (current === other) continue;
      const otherLayerIndex =
        parseFloat(other.getAttribute('data-y') || '0') / this.layerHeight;

      if (otherLayerIndex !== layerIndex) continue;

      const otherRect = other.getBoundingClientRect();

      const isOverlap =
        (otherRect.right > currentRect.left &&
          currentRect.left >= otherRect.left) ||
        (otherRect.right >= currentRect.right &&
          currentRect.right > otherRect.left) ||
        (otherRect.right > currentRect.left &&
          currentRect.right >= otherRect.right);

      if (isOverlap) return true;
    }
    return false;
  }
}
