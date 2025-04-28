import {
  Directive,
  ElementRef,
  AfterViewInit,

  Renderer2,
  Input,
} from '@angular/core';

import { DragListService } from '../services/drag-list.service';
import { Media } from '../models/time-period.model';
import interact from 'interactjs';

@Directive({
  selector: '[appResizable]',
  standalone: true,
})
export class ResizableDirective implements AfterViewInit {
  @Input() index = 0;
  @Input() timePerWidth = 50;


  move = true;
  private placeholder: HTMLElement | null = null;
  private initialWidth = 0;
  private medias:Media[]=[];
  

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private dragListService: DragListService
  ) {
    this.dragListService.medias$.subscribe((medias) => {
      this.medias=medias
      
    })
  }


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
        },

        move: (event) => {
          const { left } = event.edges;
          const target = event.target;
          const x = parseFloat(target.dataset.x || '0') + event.deltaRect.left;
          
          if (x < 0  || ( this.medias[this.index].video && event.rect.width >this.initialWidth)) {
            this.move = false;
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
            this.dragListService.resize({
              width: event.rect.width,
              index: this.index,
              timePerWidth:this.timePerWidth
            });
          }
          this.removePlaceholder();
          this.move = true;
        },
      },
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
    this.renderer.addClass(handle, 'resize-handle-container');
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
