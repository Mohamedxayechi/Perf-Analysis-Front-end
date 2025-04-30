import { Component, AfterViewInit, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import Konva from 'konva';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ShapeDrawingService, ShapeType } from '../services/shape-drawing.service';
import { ToolService } from '../services/tool.service';


@Component({
  selector: 'app-mediaplayer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mediaplayer.component.html',
  styleUrls: ['./mediaplayer.component.scss']
})
export class MediaplayerComponent implements AfterViewInit, OnInit, OnDestroy {
  private stage!: Konva.Stage;
  private gridLayer!: Konva.Layer;  
  private shapeLayer!: Konva.Layer;
  private transformer!: Konva.Transformer;
  public selectedNode: Konva.Shape | Konva.Group | null = null; 
  private isDrawing: boolean = false;
  private drawMode: boolean = false;
  private subscription: Subscription | null = null;
  activeTool: ShapeType | null = null;
  showTextInput = false;
  inputPos = { x: 0, y: 0 };
  
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null = null;

  @Output() shapeUpdated = new EventEmitter<Konva.Shape | Konva.Group | Konva.Text>(); 

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private shapeDrawingService: ShapeDrawingService,
    private toolService: ToolService
  ) {}

  ngOnInit() {
    this.subscription = this.toolService.getActiveTool().subscribe((tool) => {
      this.activeTool = tool as ShapeType;
      console.log('NgOnInit mediaplayer, Active tool updated to:', tool, 'drawMode:', this.drawMode);
      if (tool === 'rectangle' || tool === 'circle' || tool === 'line' || tool === 'ellipse' || tool === 'lightbeam' || tool === 'arrow' || tool === 'free_draw') {
        this.selectShape(tool as ShapeType);
      } else {
        this.drawMode = false;
      }
    });
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.stage) {
      this.stage.destroy();
    }
  }


  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const wrapper = document.querySelector('.canvas-player-wrapper') as HTMLElement;
      const canvas = this.canvasRef.nativeElement;
      this.ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.src = 'assets/foot.png'; 
      img.onload = () => {
        this.setupCanvasAndStage(wrapper, canvas, img);
        this.addResizeListener(wrapper, canvas, img);
      };
    }
  }

  private setupCanvasAndStage(wrapper: HTMLElement, canvas: HTMLCanvasElement, img: HTMLImageElement): void {
   
    const wrapperWidth = wrapper.offsetWidth;
    const wrapperHeight = wrapper.offsetHeight;
  
    canvas.width = wrapperWidth;
    canvas.height = wrapperHeight;
  
    let drawWidth = wrapperWidth;
    let drawHeight = wrapperHeight;
    let offsetX = 0;
    let offsetY = 0;
  
    const imgRatio = img.width / img.height;
    const canvasRatio = wrapperWidth / wrapperHeight;
    if (imgRatio > canvasRatio) {
      drawWidth = wrapperWidth;
      drawHeight = wrapperWidth / imgRatio;
      offsetY = (wrapperHeight - drawHeight) / 2;
    } else {
      drawHeight = wrapperHeight;
      drawWidth = wrapperHeight * imgRatio;
      offsetX = (wrapperWidth - drawWidth) / 2;
    }
  
    if (this.ctx) {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
  
    const container = document.getElementById('konva-container') as HTMLElement;
    const leftPercent = (offsetX / wrapperWidth) * 100;
    const widthPercent = (drawWidth / wrapperWidth) * 100;
  
    container.style.top = `${offsetY}px`;
    container.style.left = `${leftPercent}%`;
    container.style.width = `${widthPercent}%`;
    container.style.height = `${drawHeight}px`;
  
    
    if (!this.stage) {
      this.stage = new Konva.Stage({
        container: 'konva-container',
        width: drawWidth,
        height: drawHeight,
        listening: true,
        pixelRatio: 1
      });
  
      
      this.gridLayer = new Konva.Layer();
      this.shapeLayer = new Konva.Layer();
      this.stage.add(this.gridLayer);    
      this.stage.add(this.shapeLayer);  
      

      this.transformer = new Konva.Transformer();
      this.shapeLayer.add(this.transformer);
      
  
      this.shapeDrawingService.setLayer(this.shapeLayer);
  
     
      this.initEventHandlers();
    } else {
      this.stage.width(drawWidth);
      this.stage.height(drawHeight);
    }
  
    
    this.addGrid(drawWidth, drawHeight);
  
    
    this.gridLayer.draw();
    this.shapeLayer.draw();
  }

 
  private addGrid(width: number, height: number): void {
    this.gridLayer.removeChildren(); 
    const gridSize = 50;
    const gridColor = 'rgba(0, 0, 0, 0.2)';
    const labelColor = 'rgba(0, 0, 0, 0.5)';
    const labelFontSize = 12;

    for (let x = 0; x <= width; x += gridSize) {
      const line = new Konva.Line({
        points: [x, 0, x, height],
        stroke: gridColor,
        strokeWidth: 1
      });
      this.gridLayer.add(line);

      const label = new Konva.Text({
        x: x,
        y: 5,
        text: `${x}`,
        fontSize: labelFontSize,
        fill: labelColor
      });
      this.gridLayer.add(label);
    }

    for (let y = 0; y <= height; y += gridSize) {
      const line = new Konva.Line({
        points: [0, y, width, y],
        stroke: gridColor,
        strokeWidth: 1
      });
      this.gridLayer.add(line);

      const label = new Konva.Text({
        x: 5,
        y: y,
        text: `${y}`,
        fontSize: labelFontSize,
        fill: labelColor
      });
      this.gridLayer.add(label);
    }
  }

  private addResizeListener(wrapper: HTMLElement, canvas: HTMLCanvasElement, img: HTMLImageElement): void {
    window.addEventListener('resize', () => {
      this.setupCanvasAndStage(wrapper, canvas, img);
    });
  }
  private initEventHandlers() {
   
    this.stage.on('mousedown', (e) => {
      if (e.target === this.stage && this.drawMode && !this.isDrawing && this.activeTool) {
        if (this.activeTool === 'lightbeam') {
          this.isDrawing = true;
          const beamGroup = this.shapeDrawingService.drawLightbeam(this.stage.getPointerPosition()!);
          this.selectNode(beamGroup);
          this.isDrawing = false;
          this.shapeUpdated.emit(beamGroup);
        } else {
          this.isDrawing = true;
          this.shapeDrawingService.startDrawing(this.stage.getPointerPosition()!, this.activeTool);
          this.transformer.nodes([]);
          this.selectedNode = null;
        }
      }
    });

    this.stage.on('mousemove', () => {
      if (this.isDrawing && this.activeTool) {
        this.shapeDrawingService.updateDrawing(
          this.stage.getPointerPosition()!,
          this.activeTool
        );
      }
    });

    this.stage.on('mouseup', () => {
      if (this.isDrawing) {
        const shape = this.shapeDrawingService.finishDrawing();
        if (shape && shape.getParent()?.getType() !== 'Group') {
          this.isDrawing = false;
          shape.on('click', () => {
            this.selectNode(shape);
          });
          shape.on('transformend', () => {
            this.shapeUpdated.emit(shape);
          });
          this.shapeUpdated.emit(shape);
          this.shapeDrawingService.reset();
        }
      }
    });

    this.stage.on('click', (e) => {
      console.log('Click: target=', e.target, 'activeTool=', this.activeTool, 'isDrawing=', this.isDrawing);
      if (this.isDrawing) {
        this.isDrawing = false;
        return;
      }

      const pos = this.stage.getPointerPosition();
      if (!pos) return;

      let node: Konva.Shape | Konva.Group = e.target;

      if (node instanceof Konva.Shape && node.getParent()?.getType() === 'Group') {
        const parent = node.getParent();
        if (parent instanceof Konva.Group) {
          node = parent;
        }
      }

     if (this.activeTool === 'text' && e.target === this.stage) {
      const stageRect = this.stage.container().getBoundingClientRect();
      const textNode = this.shapeDrawingService.addText(pos, stageRect, this.transformer);
      textNode.on('click', () => {
        this.selectNode(textNode);
       
      });
      textNode.on('dblclick', () => {
        this.shapeDrawingService.editText(textNode, stageRect, this.transformer);
      });
      textNode.on('transformend', () => {
        this.shapeUpdated.emit(textNode);
      });
      this.selectNode(textNode);
      return;
    }

      if (this.activeTool === 'polygon') {
        this.shapeDrawingService.drawPolygon(pos);
        this.shapeLayer.draw();
      }

      if (
        node !== this.stage &&
        (node instanceof Konva.Group || (node instanceof Konva.Shape && node.getParent()?.getType() !== 'Group'))
      ) {
        this.selectNode(node);
        if (node instanceof Konva.Group) {
          console.log('lightbeam selected');
        }
      } else if (e.target === this.stage) {
        this.transformer.nodes([]);
        this.selectedNode = null;
        this.shapeLayer.draw();
      }
    });

    this.stage.on('dblclick', (e) => {
      const node = e.target;
      if (node instanceof Konva.Text) {
        const stageRect = this.stage.container().getBoundingClientRect();
        
        this.shapeDrawingService.editText(node, stageRect, this.transformer);
      } else if (this.shapeDrawingService.isDrawingPolygon()) {
        this.shapeDrawingService.finishPolygon();
      }
    });
  }

  
  

  selectShape(shape: ShapeType) {
    this.activeTool = shape;
    this.drawMode = true;
    console.log('Shape selected:', shape, 'drawMode:', this.drawMode);
  }

  private selectNode(node: Konva.Shape | Konva.Group) {

  
    this.transformer.nodes([node]);
    this.selectedNode = node;
    this.transformer.forceUpdate();
    console.log('Selected node:', node);
    this.shapeLayer.draw();
    this.shapeUpdated.emit(node);
  }

 /*  deleteShape() {
    if (this.selectedNode) {
      this.selectedNode.remove();
      this.transformer.nodes([]);
      this.selectedNode = null;
      this.shapeLayer.draw();
    }
  } */
}