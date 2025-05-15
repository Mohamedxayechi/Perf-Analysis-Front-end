import {
  Directive,
  ElementRef,
  AfterViewInit,
  Renderer2,
  Input,
} from '@angular/core';
import { Engine } from '../../../Core/Engine';
import { Media } from '../models/time-period.model';
import interact from 'interactjs';
import { EventPayload } from '../../../Core/Utility/event-bus';

@Directive({
  selector: '[appResizable]',
  standalone: true,
})
export class ResizableDirective implements AfterViewInit {
  @Input() index = 0;
  @Input() timePerWidth = 50; // Pixels per second, ensure consistency

  private move = true;
  private placeholder: HTMLElement | null = null;
  private initialWidth = 0;
  private media: Media | null = null;
  private effectiveTimePerWidth: number = 50; // Fallback for validation

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    // Validate timePerWidth
    this.effectiveTimePerWidth = this.timePerWidth;
    if (this.timePerWidth < 1) {
      console.warn(
        `[${new Date().toISOString()}] ResizableDirective: timePerWidth (${this.timePerWidth}) is unusually small, using fallback of 50. Check @Input binding.`
      );
      this.effectiveTimePerWidth = 50;
    }

    this.addResizeStyle();

    interact(this.el.nativeElement).resizable({
      edges: { left: '.resize-handle-left', right: '.resize-handle-right' },
      listeners: {
        start: (event) => {
          const { left } = event.edges;
          const target = event.target as HTMLElement;
          this.initialWidth = target.offsetWidth;
          if (left) this.createPlaceholder(target);
          Engine.getInstance().emit({
            type: 'media.get',
            data: { index: this.index },
            origin: 'component',
            processed: false,
          });
          console.log(
            `[${new Date().toISOString()}] ResizableDirective: Resize started for index ${this.index}, initialWidth: ${this.initialWidth}px, timePerWidth: ${this.effectiveTimePerWidth}`
          );
        },
        move: (event) => {
          const { left } = event.edges;
          const target = event.target;
          const x = parseFloat(target.dataset.x || '0') + event.deltaRect.left;
          const minWidth = 10; // Prevent collapse
          const maxWidth = 500; // Prevent oversized
          const constrainedWidth = Math.max(
            minWidth,
            Math.min(event.rect.width, maxWidth)
          );

          if (
            x < 0 ||
            (this.media?.video && constrainedWidth > this.initialWidth)
          ) {
            this.move = false;
          } else {
            this.move = true;
          }

          if (this.move) {
            Object.assign(target.style, {
              width: `${constrainedWidth}px`,
              height: `${event.rect.height}px`,
            });

            if (this.placeholder && left) {
              const placeholderWidth = this.initialWidth - constrainedWidth;
              this.renderer.setStyle(
                this.placeholder,
                'width',
                `${Math.max(0, placeholderWidth)}px`
              );
            }

            target.dataset.x = x.toString();
            console.log(
              `[${new Date().toISOString()}] ResizableDirective: Move for index ${this.index}, width: ${constrainedWidth}px, x: ${x}`
            );
          }
        },
        end: (event) => {
          const target = event.target;
          target.dataset.x = '0';

          if (this.move) {
            const newWidth = event.rect.width;
            const newTime = newWidth / this.effectiveTimePerWidth;
            console.log(
              `[${new Date().toISOString()}] ResizableDirective: End for index ${this.index}, width: ${newWidth}px, newTime: ${newTime}, timePerWidth: ${this.effectiveTimePerWidth}`
            );
            // Update the resizable element's styles
            this.renderer.setStyle(
              this.el.nativeElement,
              'width',
              `${newWidth}px`
            );
            this.renderer.setStyle(
              this.el.nativeElement,
              'height',
              `${event.rect.height}px`
            );
            // Store width to prevent re-rendering issues
            this.renderer.setAttribute(
              this.el.nativeElement,
              'data-resized-width',
              newWidth.toString()
            );
            // Update canvas if applicable
            const canvas = this.el.nativeElement.querySelector('canvas');
            if (canvas) {
              canvas.width = newWidth;
              canvas.height = event.rect.height;
              console.log(
                `[${new Date().toISOString()}] ResizableDirective: Canvas resized to ${newWidth}x${event.rect.height}`
              );
            }
            Engine.getInstance().emit({
              type: 'media.resized',
              data: { index: this.index, time: newTime, width: newWidth },
              origin: 'component',
              processed: false,
            });
          }
          this.removePlaceholder();
          this.move = true;
        },
      },
    });

    // Subscribe to media.get response
    Engine.getInstance()
      .getEvents()
      .on('media.get.response', (event: EventPayload) => {
        if (event.data?.index === this.index && event.data?.media) {
          this.media = event.data.media;
          console.log(
            `[${new Date().toISOString()}] ResizableDirective: Media fetched for index ${this.index}`,
            this.media
          );
        } else {
          console.warn(
            `[${new Date().toISOString()}] ResizableDirective: No media found for index ${this.index}`
          );
        }
      });
  }

  private createPlaceholder(target: HTMLElement) {
    const parent = target.parentElement?.parentElement;
    if (!parent) {
      console.error(
        `[${new Date().toISOString()}] ResizableDirective: Parent element not found for placeholder`
      );
      return;
    }

    this.placeholder = this.renderer.createElement('div');
    this.renderer.addClass(this.placeholder, 'placeholder-box');
    this.renderer.setStyle(this.placeholder, 'height', `${target.offsetHeight}px`);
    this.renderer.setStyle(this.placeholder, 'width', `${this.initialWidth}px`);
    this.renderer.setStyle(this.placeholder, 'display', 'inline-block');

    this.renderer.insertBefore(parent, this.placeholder, target.parentElement);
    console.log(
      `[${new Date().toISOString()}] ResizableDirective: Placeholder created with width ${this.initialWidth}px`
    );
  }

  private removePlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.renderer.removeChild(this.placeholder.parentNode, this.placeholder);
      this.placeholder = null;
      console.log(
        `[${new Date().toISOString()}] ResizableDirective: Placeholder removed`
      );
    }
  }

  addResizeStyle() {
    const handle = this.renderer.createElement('div');
    this.renderer.appendChild(this.el.nativeElement, handle);

    // Left arrow
    const leftArrow = this.renderer.createElement('span');
    this.renderer.addClass(leftArrow, 'material-icons');
    this.renderer.addClass(leftArrow, 'resize-handle-arrow');
    this.renderer.addClass(leftArrow, 'resize-handle-left');
    const leftText = this.renderer.createText('arrow_back_ios');
    this.renderer.appendChild(leftArrow, leftText);

    // Right arrow
    const rightArrow = this.renderer.createElement('span');
    this.renderer.addClass(rightArrow, 'material-icons');
    this.renderer.addClass(rightArrow, 'resize-handle-arrow');
    this.renderer.addClass(rightArrow, 'resize-handle-right');
    const rightText = this.renderer.createText('arrow_forward_ios');
    this.renderer.appendChild(rightArrow, rightText);

    this.renderer.appendChild(handle, leftArrow);
    this.renderer.appendChild(handle, rightArrow);

    // Prevent CSS overrides
    this.renderer.setStyle(this.el.nativeElement, 'max-width', 'none');
    this.renderer.setStyle(this.el.nativeElement, 'min-width', '10px');
    this.renderer.setStyle(this.el.nativeElement, 'box-sizing', 'border-box');
  }
}