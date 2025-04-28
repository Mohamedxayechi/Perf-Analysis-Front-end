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
import { DragListService } from '../services/drag-list.service';
import { ParameterService } from '../services/parameter.service';
import { EventsService } from '../services/events.service';

@Directive({
  selector: '[appTimelineCanvas]',
  standalone: true,
})
export class TimelineCanvasDirective implements AfterViewInit, OnChanges {
   
  @Input() distancePerTime = 30;
  @Input() scale = 1;
  @Input() minScale = 1;
  @Input() maxScale = 2;
  @Input() scaleStep = 0.1;
  @Input() spaceBeforLine = 15;
  @Input() cursorX = 0;
  @Output() widthEmitte = new EventEmitter<number>();
  @Output() scaleEmitte = new EventEmitter<number>();
  @Output() cursorMove = new EventEmitter<number>();
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  @Input() time = 0;

  private timeLineHeight = 40;
  private timeLineWidth = 0;
  private tickData: { x: number; time: string }[] = [];

  //hover state
  private hoveredTick = null;
  private currentTickUnderMouse: { x: number; time: string } | null = null;
  private hoverStartTime: number | null = null;
  private hoverCheckInterval: ReturnType<typeof setInterval> | null = null;
  //
  private isDraggingCursor = false;

  constructor(private el: ElementRef<HTMLCanvasElement>,private dragListService: DragListService,private parameterService: ParameterService,private eventsService:EventsService) {
    this.canvas = this.el.nativeElement;
    this.context = this.canvas.getContext('2d')!;
  }

  ngAfterViewInit(): void {
    //this.renderer.listen(window, 'resize', () => this.draw(this.context));
    this.canvas.addEventListener('wheel', this.onCanvasScroll.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener(
      'mousemove',
      this.onCanvasMouseMove.bind(this)
    );
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.updateTimelineSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['time'] || changes['distancePerTime']) {
      this.updateTimelineSize();
      
      this.draw(this.context);
    }

    if (changes['scale']) {
      const prevScale = changes['scale'].previousValue ?? 1;
      this.distancePerTime = (this.distancePerTime / prevScale) * this.scale;
      this.updateTimelineSize();
      this.draw(this.context);
    }
  }

  private updateTimelineSize(): void {
    this.timeLineWidth = this.distancePerTime * this.time;
  }
  private draw(context: CanvasRenderingContext2D): void {
    const canvas = this.el.nativeElement;
    const parentWidth = canvas.parentElement?.clientWidth || this.timeLineWidth;

    if (this.timeLineWidth < parentWidth) {
      this.timeLineWidth = parentWidth;
      this.distancePerTime = parentWidth / this.time;
      this.parameterService.setDistancePerTime(this.distancePerTime);
      
    }


    canvas.width = this.spaceBeforLine * 6 + this.timeLineWidth;
    canvas.height = this.timeLineHeight;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(this.spaceBeforLine, 0);

    this.drawLineAndTicks(context);

    this.widthEmitte.emit(this.timeLineWidth);
  }

  private drawLineAndTicks(context: CanvasRenderingContext2D): void {
    this.tickData = [];

    context.beginPath();
    context.moveTo(0, 15);
    context.lineTo(Math.ceil(this.time)*this.distancePerTime, 15);
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.stroke();

    let n=this.time
    if(Math.ceil(this.time)==this.time)
      n=this.time
    else 
      n=this.time+1

    for (let i = 0; i <= this.time; i++) {
      const x = i * this.distancePerTime;

      // Major tick
      context.beginPath();
      context.moveTo(x, 8);
      context.lineTo(x, 22);
      context.stroke();

      this.tickData.push({ x, time: `${i}s` });

      // Minor ticks
      if (i !== n  ) {
        for (let j = 1; j < 5; j++) {
          const minorX = x + (this.distancePerTime / 5) * j;
          context.beginPath();
          context.moveTo(minorX, 11);
          context.lineTo(minorX, 19);
          context.stroke();
        }
      
      }

      // Time label
      context.font = '10px Arial';
      context.fillStyle = '#000';
      context.textAlign = 'center';
      context.fillText(i.toString(), x, 30);
    }
  }

  private onCanvasScroll(event: WheelEvent): void {
    event.preventDefault();

    this.scale =
      event.deltaY < 0
        ? Math.min(this.maxScale, this.scale + this.scaleStep)
        : Math.max(this.minScale, this.scale - this.scaleStep);

    this.scaleEmitte.emit(this.scale);
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - this.spaceBeforLine;

    // Find the tick in ±2px margin
    const tick = this.tickData.find((t) => Math.abs(x - t.x) <= 5);

    // Not hovering near a tick
    if (!tick) {
      this.resetHoverState();
      return;
    }

    // Same tick still hovered
    if (this.currentTickUnderMouse && this.currentTickUnderMouse.x === tick.x) {
      return;
    }

    // New tick hover start
    this.resetHoverState();
    this.currentTickUnderMouse = tick;
    this.hoverStartTime = Date.now();

    // Start checking hover duration every 100ms
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
    const x = (event.offsetX - this.spaceBeforLine) / this.scale;
    this.cursorX = Math.max(0, Math.min(x, this.timeLineWidth / this.scale));
    this.parameterService.setCurosrX(this.cursorX);
    this.eventsService.changeCursorEvent(this.cursorX);
  
  }

  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDraggingCursor) return;

    const x = (event.offsetX - this.spaceBeforLine) / this.scale;
    this.cursorX = Math.max(0, Math.min(x, this.timeLineWidth / this.scale));
    this.parameterService.setCurosrX(this.cursorX);
    this.eventsService.changeCursorEvent(this.cursorX);
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
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.draw(this.context);
    }
  }

  
  private showTooltip(tick: any): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw(this.context);

    const text = `⏱ time ${tick.time}`;
    this.context.save();
    this.context.font = '12px Arial';
    const textWidth = this.context.measureText(text).width;

    this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.context.fillRect(tick.x, 0, textWidth + 50, 20);

    this.context.fillStyle = '#fff';
    this.context.fillText(text, tick.x + 50, 14);
    this.context.restore();

    this.hoveredTick = tick;
  }
}
