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
  @Input() timePerWidth = 50; // Maps to distancePerTime

  private move = true;
  private placeholder: HTMLElement | null = null;
  private initialWidth = 0;
  private media: Media | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.addResizeStyle();

    interact(this.el.nativeElement).resizable({
      edges: { left: '.resize-handle-left', right: '.resize-handle-right' },
      listeners: {
        start: (event) => {
          const { left } = event.edges;
          const target = event.target as HTMLElement;
          this.initialWidth = target.offsetWidth;
          if (left) this.createPlaceholder(target);
          // Fetch current media from Engine or parent component
          Engine.getInstance().emit({
            type: 'media.get',
            data: { index: this.index },
            origin: 'component',
            processed: false,
          });
        },
        move: (event) => {
          const { left } = event.edges;
          const target = event.target;
          const x = parseFloat(target.dataset.x || '0') + event.deltaRect.left;

          // Restrict resizing for videos beyond initial width or negative width
          if (
            x < 0 ||
            (this.media?.video && event.rect.width > this.initialWidth)
          ) {
            this.move = false;
          } else {
            this.move = true;
          }

          if (this.move) {
            Object.assign(target.style, {
              width: `${event.rect.width}px`,
              height: `${event.rect.height}px`,
            });

            if (this.placeholder && left) {
              const placeholderWidth = this.initialWidth - event.rect.width;
              this.renderer.setStyle(
                this.placeholder,
                'width',
                `${placeholderWidth}px`
              );
            }

            target.dataset.x = x.toString();
          }
        },
        end: (event) => {
          const target = event.target;
          target.dataset.x = '0';

          if (this.move) {
            const newTime = event.rect.width / this.timePerWidth;
            console.log(`[${new Date().toISOString()}] ResizableDirective: Emitting media.resized for index ${this.index}, newTime: ${newTime}`);
            Engine.getInstance().emit({
              type: 'media.resized',
              data: { index: this.index, time: newTime },
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
          
        }
      });
  }

  private createPlaceholder(target: HTMLElement) {
    const parent = target.parentElement?.parentElement;
    if (!parent) return;

    this.placeholder = this.renderer.createElement('div');
    this.renderer.addClass(this.placeholder, 'placeholder-box');
    this.renderer.setStyle(this.placeholder, 'height', `${target.offsetHeight}px`);

    this.renderer.insertBefore(parent, this.placeholder, target.parentElement);
  }

  private removePlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.renderer.removeChild(this.placeholder.parentNode, this.placeholder);
      this.placeholder = null;
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
  }
}