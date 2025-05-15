import {
  Directive,
  ElementRef,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { Engine } from '../../../Core/Engine';
import { EventPayload } from '../../../Core/Utility/event-bus';

interface Tick {
  time: string | number;
  x: number;
}

@Directive({
  selector: '[appTimelineCanvas]',
  standalone: true,
})
export class TimelineCanvasDirective implements AfterViewInit, OnChanges {
  @Input() distancePerTime = 50; // Default to 50 (matches Display)
  @Input() scale = 1;
  @Input() minScale = 0.1; // Match Display's min zoom
  @Input() maxScale = 2; // Match Display's max zoom
  @Input() scaleStep = 0.1;
  @Input() spaceBeforLine = 15;
  @Input() cursorX = 0;
  @Input() time = 0;
  @Output() widthEmitte = new EventEmitter<number>();
  @Output() scaleEmitte = new EventEmitter<number>();
  @Output() cursorMove = new EventEmitter<number>();

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  private timeLineHeight = 40;
  private timeLineWidth = 0;
  private tickData: { x: number; time: string }[] = [];
  private hoveredTick: Tick | null = null;
  private currentTickUnderMouse: { x: number; time: string } | null = null;
  private hoverStartTime: number | null = null;
  private hoverCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isDraggingCursor = false;

  constructor(private el: ElementRef<HTMLCanvasElement>) {
    this.canvas = this.el.nativeElement;
    this.context = this.canvas.getContext('2d')!;
  }

  ngAfterViewInit(): void {
    this.canvas.addEventListener('wheel', this.onCanvasScroll.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.updateTimelineSize();
    this.draw(this.context);
  }

  ngOnChanges(changes: SimpleChanges): void {
    let needsRedraw = false;
    if (changes['time'] || changes['distancePerTime'] || changes['scale']) {
      this.updateTimelineSize();
      needsRedraw = true;
    }
    if (changes['cursorX']) {
      needsRedraw = true;
    }
    if (needsRedraw) {
      this.draw(this.context);
    }
  }

  private updateTimelineSize(): void {
    this.timeLineWidth = this.distancePerTime * this.time;
    this.widthEmitte.emit(this.timeLineWidth);
  }

  private draw(context: CanvasRenderingContext2D): void {
    const canvas = this.el.nativeElement;
    canvas.width = this.spaceBeforLine + this.timeLineWidth * this.scale; // Scale canvas width
    canvas.height = this.timeLineHeight;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(this.spaceBeforLine, 0);
    context.scale(this.scale, 1); // Apply scale to drawing

    this.drawLineAndTicks(context);
    this.drawCursor(context);

    if (this.hoveredTick) {
      this.showTooltip(this.hoveredTick);
    }
  }

  private drawLineAndTicks(context: CanvasRenderingContext2D): void {
    this.tickData = [];

    // Draw timeline line
    context.beginPath();
    context.moveTo(0, 15);
    context.lineTo(this.timeLineWidth, 15);
    context.strokeStyle = 'black';
    context.lineWidth = 1 / this.scale; // Adjust line width for scale
    context.stroke();

    const n = Math.ceil(this.time);
    for (let i = 0; i <= n; i++) {
      const x = i * this.distancePerTime;

      // Major tick
      context.beginPath();
      context.moveTo(x, 8);
      context.lineTo(x, 22);
      context.stroke();

      this.tickData.push({ x, time: `${i}s` });

      // Minor ticks
      if (i !== n) {
        for (let j = 1; j < 5; j++) {
          const minorX = x + (this.distancePerTime / 5) * j;
          context.beginPath();
          context.moveTo(minorX, 11);
          context.lineTo(minorX, 19);
          context.stroke();
        }
      }

      // Time label
      context.font = `10px Arial`;
      context.fillStyle = '#000';
      context.textAlign = 'center';
      context.fillText(i.toString(), x, 30);
    }
  }

  private drawCursor(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.moveTo(this.cursorX, 0);
    context.lineTo(this.cursorX, this.timeLineHeight);
    context.strokeStyle = 'red';
    context.lineWidth = 2 / this.scale; // Adjust for scale
    context.stroke();
  }

  private onCanvasScroll(event: WheelEvent): void {
    event.preventDefault();
    const newScale =
      event.deltaY < 0
        ? Math.min(this.maxScale, this.scale + this.scaleStep)
        : Math.max(this.minScale, this.scale - this.scaleStep);
    this.scaleEmitte.emit(newScale);
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.spaceBeforLine) / this.scale; // Adjust for scale

    const tick = this.tickData.find((t) => Math.abs(x - t.x) <= 5 / this.scale);
    if (!tick) {
      this.resetHoverState();
      return;
    }

    if (this.currentTickUnderMouse && this.currentTickUnderMouse.x === tick.x) {
      return;
    }

    this.resetHoverState();
    this.currentTickUnderMouse = tick;
    this.hoverStartTime = Date.now();

    this.hoverCheckInterval = setInterval(() => {
      const now = Date.now();
      if (this.hoverStartTime && now - this.hoverStartTime >= 500) {
        this.showTooltip(tick);
        this.resetHoverState(false);
      }
    }, 100);
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDraggingCursor = true;
    this.updateCursorPosition(event);
  }

  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDraggingCursor) return;
    this.updateCursorPosition(event);
  }

  private updateCursorPosition(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.spaceBeforLine) / this.scale;
    this.cursorX = Math.max(0, Math.min(x, this.timeLineWidth));
    this.cursorMove.emit(this.cursorX);
    this.draw(this.context); // Redraw to update cursor
  }

  private onMouseUp(): void {
    this.isDraggingCursor = false;
  }

  private resetHoverState(clearTooltip = true): void {
    if (this.hoverCheckInterval) {
      clearInterval(this.hoverCheckInterval);
      this.hoverCheckInterval = null;
    }
    this.hoverStartTime = null;
    this.currentTickUnderMouse = null;

    if (clearTooltip && this.hoveredTick) {
      this.hoveredTick = null;
      this.draw(this.context);
    }
  }

  private showTooltip(tick: Tick): void {
    this.hoveredTick = tick;
    this.draw(this.context); // Redraw to include tooltip

    const text = `⏱ time ${tick.time}`;
    this.context.save();
    this.context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for tooltip
    this.context.translate(this.spaceBeforLine, 0);
    this.context.font = '12px Arial';
    const textWidth = this.context.measureText(text).width;

    this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.context.fillRect(tick.x * this.scale, 0, textWidth + 10, 20); // Adjust x for scale
    this.context.fillStyle = '#fff';
    this.context.fillText(text, tick.x * this.scale + 5, 14); // Adjust x for scale
    this.context.restore();
  }
}