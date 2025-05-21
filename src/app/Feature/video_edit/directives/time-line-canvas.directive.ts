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

interface Tick {
  time: string | number;
  x: number;
}

@Directive({
  selector: '[appTimelineCanvas]',
  standalone: true,
})
export class TimelineCanvasDirective implements AfterViewInit, OnChanges {
  @Input() distancePerTime = 50;
  @Input() scale = 1;
  @Input() minScale = 0.1;
  @Input() maxScale = 2;
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

  /**
   * Initializes the directive with a reference to the canvas element.
   * @param el Reference to the host canvas element.
   */
  constructor(private el: ElementRef<HTMLCanvasElement>) {
    this.canvas = this.el.nativeElement;
    this.context = this.canvas.getContext('2d')!;
  }

  /**
   * Sets up event listeners and initializes the canvas after the view is initialized.
   */
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

  /**
   * Handles input changes and redraws the canvas if necessary.
   * @param changes The collection of input changes.
   */
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

  /**
   * Updates the timeline width based on duration and distance per time, emitting the new width.
   */
  private updateTimelineSize(): void {
    this.timeLineWidth = this.distancePerTime * this.time;
    this.widthEmitte.emit(this.timeLineWidth);
  }

  /**
   * Draws the timeline, including the line, ticks, cursor, and tooltip if applicable.
   * @param context The 2D rendering context of the canvas.
   */
  private draw(context: CanvasRenderingContext2D): void {
    const canvas = this.el.nativeElement;
    canvas.width = this.spaceBeforLine + this.timeLineWidth * this.scale;
    canvas.height = this.timeLineHeight;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(this.spaceBeforLine, 0);
    context.scale(this.scale, 1);

    this.drawLineAndTicks(context);
    this.drawCursor(context);

    if (this.hoveredTick) {
      this.drawTooltip(context, this.hoveredTick);
    }
  }

  /**
   * Draws the timeline's main line and tick marks with labels.
   * @param context The 2D rendering context of the canvas.
   */
  private drawLineAndTicks(context: CanvasRenderingContext2D): void {
    this.tickData = [];

    context.beginPath();
    context.moveTo(0, 15);
    context.lineTo(this.timeLineWidth, 15);
    context.strokeStyle = 'black';
    context.lineWidth = 1 / this.scale;
    context.stroke();

    const n = Math.ceil(this.time);
    for (let i = 0; i <= n; i++) {
      const x = i * this.distancePerTime;

      context.beginPath();
      context.moveTo(x, 8);
      context.lineTo(x, 22);
      context.stroke();

      this.tickData.push({ x, time: `${i}s` });

      if (i !== n) {
        for (let j = 1; j < 5; j++) {
          const minorX = x + (this.distancePerTime / 5) * j;
          context.beginPath();
          context.moveTo(minorX, 11);
          context.lineTo(minorX, 19);
          context.stroke();
        }
      }

      context.font = `10px Arial`;
      context.fillStyle = '#000';
      context.textAlign = 'center';
      context.fillText(i.toString(), x, 30);
    }
  }

  /**
   * Draws the cursor line at the current cursor position.
   * @param context The 2D rendering context of the canvas.
   */
  private drawCursor(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.moveTo(this.cursorX, 0);
    context.lineTo(this.cursorX, this.timeLineHeight);
    context.strokeStyle = 'red';
    context.lineWidth = 2 / this.scale;
    context.stroke();
  }

  /**
   * Draws a tooltip displaying the time at the hovered tick.
   * @param context The 2D rendering context of the canvas.
   * @param tick The tick object containing position and time.
   */
  private drawTooltip(context: CanvasRenderingContext2D, tick: Tick): void {
    const text = `⏱ time ${tick.time}`;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(this.spaceBeforLine, 0);
    context.font = '12px Arial';
    const textWidth = context.measureText(text).width;

    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(tick.x * this.scale, 0, textWidth + 10, 20);
    context.fillStyle = '#fff';
    context.fillText(text, tick.x * this.scale + 5, 14);
    context.restore();
  }

  /**
   * Handles mouse wheel events to adjust the timeline scale.
   * @param event The wheel event containing scroll direction.
   */
  private onCanvasScroll(event: WheelEvent): void {
    event.preventDefault();
    const newScale =
      event.deltaY < 0
        ? Math.min(this.maxScale, this.scale + this.scaleStep)
        : Math.max(this.minScale, this.scale - this.scaleStep);
    this.scaleEmitte.emit(newScale);
  }

  /**
   * Handles mouse movement to display tooltips over timeline ticks.
   * @param event The mouse event containing position data.
   */
  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.spaceBeforLine) / this.scale;

    const tick = this.tickData.find((t) => Math.abs(x - t.x) <= 5 / this.scale);
    if (!tick) {
      this.resetHoverState();
      this.draw(this.context);
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
        this.hoveredTick = tick;
        this.draw(this.context);
        this.resetHoverState(false);
      }
    }, 100);
  }

  /**
   * Initiates cursor dragging on mouse down.
   * @param event The mouse event triggering the drag.
   */
  private onMouseDown(event: MouseEvent): void {
    this.isDraggingCursor = true;
    this.updateCursorPosition(event);
  }

  /**
   * Updates the cursor position during dragging.
   * @param event The mouse event containing movement data.
   */
  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDraggingCursor) return;
    this.updateCursorPosition(event);
  }

  /**
   * Calculates and emits the new cursor position based on mouse coordinates.
   * @param event The mouse event containing position data.
   */
  private updateCursorPosition(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.spaceBeforLine) / this.scale;
    this.cursorX = Math.max(0, Math.min(x, this.timeLineWidth));
    this.cursorMove.emit(this.cursorX);
    this.draw(this.context);
  }

  /**
   * Stops cursor dragging on mouse up or mouse leave.
   */
  private onMouseUp(): void {
    this.isDraggingCursor = false;
  }

  /**
   * Resets the hover state for tooltips, optionally clearing the displayed tooltip.
   * @param clearTooltip Whether to clear the currently displayed tooltip.
   */
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
}