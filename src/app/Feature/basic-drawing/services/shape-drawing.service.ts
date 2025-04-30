import { Injectable } from '@angular/core';
import Konva from 'konva';
export type ShapeType = 'circle' | 'rectangle' | 'ellipse' | 'lightbeam' | 'arrow' | 'polygon' | 'free_draw' | 'text';
export interface ArrowGroup extends Konva.Group {
  shaft?: Konva.Rect;
  arrowHead?: Konva.Arrow;
}

@Injectable({
  providedIn: 'root'
})

export class ShapeDrawingService {

  private layer!: Konva.Layer;
  private tempShape: Konva.Shape | Konva.Group | null = null;
  private startPos: { x: number; y: number } | null = null;
  private isDrawing: boolean = false;
  private activePolygon: Konva.Line | null = null;
  private activeInput: HTMLElement | null = null;
  private activeSvg: SVGSVGElement | null = null;

  
  private handleOutsideClick: (e: MouseEvent) => void = () => {};

  setLayer(layer: Konva.Layer): void {
    this.layer = layer;
  }

 

  addText(pos: { x: number; y: number }, stageRect: DOMRect, transformer: Konva.Transformer): Konva.Text {
    const textNode = new Konva.Text({
      x: pos.x,
      y: pos.y,
      text: 'Lorem Ipsum',
      fontSize: 20,
      fontFamily: 'Arial',
      fill: 'rgb(121, 125, 180)',
      stroke: 'black',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      width: 200,
    });

    this.layer.add(textNode);
    this.layer.batchDraw();

    transformer.nodes([textNode]);
    
    transformer.boundBoxFunc((oldBox, newBox) => {
      newBox.width = Math.max(30, newBox.width);
      return newBox;
    });

    textNode.on('transform', () => {
      textNode.setAttrs({
        width: textNode.width() * textNode.scaleX(),
        scaleX: 1,
      });
    });


    this.editText(textNode, stageRect, transformer);

    return textNode;
  }

  editText(textNode: Konva.Text, stageRect: DOMRect, transformer: Konva.Transformer) {
    if (this.activeInput && this.activeSvg) {
      this.activeInput.remove();
      this.activeSvg.remove();
      this.activeInput = null;
      this.activeSvg = null;
      window.removeEventListener('click', this.handleOutsideClick);
    }

    textNode.hide();
    this.layer.batchDraw();

    const textPosition = textNode.absolutePosition();
    const areaPosition = {
      x: stageRect.left + textPosition.x,
      y: stageRect.top + textPosition.y,
    };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.activeSvg = svg;
    document.body.appendChild(svg);
    svg.style.position = 'absolute';
    svg.style.top = `${areaPosition.y}px`;
    svg.style.left = `${areaPosition.x}px`;
    svg.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    svg.style.height = `${textNode.fontSize()}px`;
    svg.style.overflow = 'visible';
    svg.style.zIndex = '1000';

    
    const svgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svg.appendChild(svgText);
    svgText.textContent = textNode.text();
    svgText.setAttribute('x', '0');
    svgText.setAttribute('y', `${textNode.fontSize() * 0.8}`);
    svgText.setAttribute('font-size', `${textNode.fontSize()}px`);
    svgText.setAttribute('font-family', textNode.fontFamily());
    svgText.setAttribute('fill', typeof textNode.fill() === 'string' ? textNode.fill() as string : 'black');
    svgText.setAttribute('stroke', textNode.stroke() as string || 'black');
    svgText.setAttribute('stroke-width', `${textNode.strokeWidth() || 1}`);
    svgText.setAttribute('text-anchor', textNode.align() === 'center' ? 'middle' : textNode.align() === 'right' ? 'end' : 'start');

    const textarea = document.createElement('textarea');
    this.activeInput = textarea;
    document.body.appendChild(textarea);
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.height = `${textNode.fontSize()}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.lineHeight = `${textNode.fontSize()}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = 'transparent';
    textarea.style.caretColor = 'black';
    textarea.style.zIndex = '1001';
    textarea.style.resize = 'none';


    const rotation = textNode.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    svg.style.transform = transform;
    textarea.style.transform = transform;

   
    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 0);

   
    const measureTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      context.font = `${textNode.fontSize()}px ${textNode.fontFamily()}`;
      return context.measureText(text).width;
    };

    const setInputWidth = (text: string) => {
      const textWidth = measureTextWidth(text) || 100;
      textarea.style.width = `${textWidth}px`;
      svg.style.width = `${textWidth}px`;
      if (textNode.align() === 'center') {
        svgText.setAttribute('x', `${textWidth / 2}`);
      } else if (textNode.align() === 'right') {
        svgText.setAttribute('x', `${textWidth}`);
      }
    };

    textarea.addEventListener('input', () => {
      svgText.textContent = textarea.value;
      setInputWidth(textarea.value);
    });

    setInputWidth(textarea.value);

    const removeInput = () => {
      if (!this.activeInput || !this.activeSvg) return;
      const newText = textarea.value.trim();
      textNode.text(newText);
      if (!newText) {
        textNode.destroy();
      }
      textNode.show();
      transformer.show();
      transformer.forceUpdate();
      this.layer.batchDraw();
      document.body.removeChild(textarea);
      document.body.removeChild(svg);
      window.removeEventListener('click', this.handleOutsideClick);
      this.activeInput = null;
      this.activeSvg = null;
    };

    this.handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        removeInput();
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        removeInput();
      }
      if (e.key === 'Escape') {
        removeInput();
      }
    });

    setTimeout(() => {
      window.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }



  drawPolygon(pos: { x: number; y: number }): void {
    if (!this.activePolygon) {
     
      this.activePolygon = new Konva.Line({
        x: pos.x,
        y: pos.y,
        points: [0, 0], 
        fill: 'rgba(221, 33, 33, 0.55)', 
        stroke: 'black',
        strokeWidth: 0.5,
        closed: true, 
        lineJoin: 'round', 
        lineCap: 'round',
        draggable: true
      });

      this.layer.add(this.activePolygon);
      this.isDrawing = true;
    } else {
      
      const points = this.activePolygon.points(); 
      points.push(pos.x - this.activePolygon.x(), pos.y - this.activePolygon.y());
      this.activePolygon.points(points); 
    }

    this.layer.batchDraw(); 
  }

 
  finishPolygon(): void {
    if (this.activePolygon) {
      this.activePolygon.closed(true); 
      this.activePolygon = null; 
      this.isDrawing = false;
      this.layer.batchDraw();
    }
  }


  isDrawingPolygon(): boolean {
    console.log(this.isDrawing);
    return this.isDrawing;

  }

  

  drawLightbeam(pos: { x: number; y: number }): Konva.Group {
      this.startPos = pos;
    
      const beam = new Konva.Rect({
        x: -25,
        y: -175,
        width: 50,
        height: 180,
        fillLinearGradientStartPoint: { x: 0, y: 180 },
        fillLinearGradientEndPoint: { x: 0, y: 0 },
        fillLinearGradientColorStops: [
          0.0, 'rgba(255, 217, 0, 0.0)', 
          0.1, 'rgba(255, 217, 0, 0.1)',
          0.4, 'rgba(255, 217, 0, 0.2)',
         
          0.7, 'rgba(255, 217, 0, 0.25)',
          0.95, 'rgba(255, 217, 0, 0.3)',
          1.0, 'rgba(255, 217, 0, 0.0)'    
        ],
        
      });


      const cutoutBeam = new Konva.Rect({
        x: -8,
        y: -27,
        width: 15,
        height: 35,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 0, y: 35 },
        fillLinearGradientColorStops: [
          0.0, 'rgba(255, 217, 0, 0.0)', 
          0.05, 'rgba(255, 217, 0, 0.2)',
          0.1, 'rgba(255, 217, 0, 0.5)',
          0.2, 'rgba(255, 217, 0, 0.85)',
          0.3, 'rgba(255, 217, 0, 0.95)',
          0.7, 'rgba(255, 217, 0, 0.95)',
          0.8, 'rgba(255, 217, 0, 0.85)',
          0.9, 'rgba(255, 217, 0, 0.5)',
          0.95, 'rgba(255, 217, 0, 0.2)',
          1.0, 'rgba(255, 217, 0, 0.0)'    
        ],
        strokeWidth: 0,
        globalCompositeOperation: 'destination-out',
      });
      
      
     
      
      const base = new Konva.Ellipse({
        x: 0,
        y: 5,
        radiusX: 25,
        radiusY: 10,
        fill:'rgba(255, 217, 0, 0.32)'
      });
      
      const beamGroup = new Konva.Group({
        x: pos.x,
        y: pos.y,
        
        draggable: true,
        listening: true
      });
      
      beamGroup.add(beam);
      beamGroup.add(base);
      beamGroup.add(cutoutBeam);
      
      
      this.layer.add(beamGroup);  
                 
      this.layer.draw();  
        
      const rect = beamGroup.getClientRect();
      console.log('Width:', rect.width, 'Height:', rect.height);
      
      return beamGroup;
      
      
      
    }
    

  startDrawing(pos: { x: number; y: number }, shapeType: ShapeType): void {
    this.isDrawing = true;
    this.startPos = pos;

    switch (shapeType) {
      case 'circle':
        this.tempShape = new Konva.Circle({
          x: pos.x,
          y: pos.y,
          radius: 0,
          fill: 'rgba(221, 33, 33, 0.55)',
          stroke: 'black',
          strokeWidth: 0.5,
          draggable: true
        });
        break;
        case 'arrow':
          this.tempShape = new Konva.Shape({
            x: pos.x,
            y: pos.y,
            startX: 0,
            startY: 0,
            sceneFunc: (context, shape) => {
              const startX = shape.getAttr('startX');
              const startY = shape.getAttr('startY');
              const endX = shape.getAttr('endX');
              const endY = shape.getAttr('endY');
        
              if (endX === undefined || endY === undefined) {
                return;
              }
        
              const dx = endX - startX;
              const dy = endY - startY;
              const angle = Math.atan2(dy, dx);
              const headLength = 20;
              const headWidth = 20;
              const shaftHeight = 10;
        
              const baseX = endX - headLength * Math.cos(angle);
              const baseY = endY - headLength * Math.sin(angle);
              const shaftLength = Math.max(
                Math.sqrt((baseX - startX) ** 2 + (baseY - startY) ** 2),
                0
              );
        
              context.beginPath();
              context.save();
              context.translate(startX, startY);
              context.rotate(angle);
        
              context.rect(0, -shaftHeight / 2, shaftLength, shaftHeight);
              context.restore();
        
              context.moveTo(endX, endY);
              context.lineTo(
                baseX + (headWidth / 2) * Math.sin(angle),
                baseY - (headWidth / 2) * Math.cos(angle)
              );
              context.lineTo(
                baseX - (headWidth / 2) * Math.sin(angle),
                baseY + (headWidth / 2) * Math.cos(angle)
              );
              context.closePath();
        
              context.strokeStyle = 'black';
              context.lineWidth = shape.getAttr('strokeWidth');
              context.stroke();
              context.fillShape(shape);
            },
            fill: 'rgba(221, 33, 33, 0.55)',
            strokeWidth: 0.5,
            draggable: true,
            name: 'customArrow',
          });
        
          this.tempShape.getSelfRect = function (this: Konva.Shape) {  
            const startX = this.getAttr('startX');
            const startY = this.getAttr('startY');
            const endX = this.getAttr('endX');
            const endY = this.getAttr('endY');
            const headLength = 20;
            const headWidth = 20;
            const shaftHeight = 10;
        
            if (endX === undefined || endY === undefined) {
              console.log('getSelfRect: endX or endY undefined, returning default box');
              return { x: startX, y: startY, width: 0, height: 0 };
            }
        
            const dx = endX - startX;
            const dy = endY - startY;
            const angle = Math.atan2(dy, dx);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
        
            const baseX = endX - headLength * cosA;
            const baseY = endY - headLength * sinA;
            const shaftLength = Math.sqrt((baseX - startX) ** 2 + (baseY - startY) ** 2);
        

            const shaftPoints = [
              { x: 0, y: -shaftHeight / 2 },
              { x: shaftLength, y: -shaftHeight / 2 },
              { x: shaftLength, y: shaftHeight / 2 },
              { x: 0, y: shaftHeight / 2 },
            ];
        
            const transformedShaftPoints = shaftPoints.map(p => ({
              x: startX + p.x * cosA - p.y * sinA,
              y: startY + p.x * sinA + p.y * cosA,
            }));
        
            const headPoints = [
              { x: endX, y: endY },
              {
                x: baseX + (headWidth / 2) * sinA,
                y: baseY - (headWidth / 2) * cosA,
              },
              {
                x: baseX - (headWidth / 2) * sinA,
                y: baseY + (headWidth / 2) * cosA,
              },
            ];
        
            const allPoints = [...transformedShaftPoints, ...headPoints];
        
            const xs = allPoints.map(p => p.x);
            const ys = allPoints.map(p => p.y);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);
        
            const boundingBox = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            };
        
            console.log('getSelfRect returning:', boundingBox);
        
            return boundingBox;
          };
        
        
          console.log('arrow created: startPos=', [pos.x, pos.y]);
          break;
    
      case 'ellipse':
          this.tempShape = new Konva.Ellipse({
            x: pos.x,
            y: pos.y,
            radiusX: 0,
            radiusY: 0,
            fill: 'rgba(221, 33, 33, 0.55)',
            stroke: 'black',
            strokeWidth: 0.5,
            draggable: true
          });
          break;
      case 'rectangle':
        this.tempShape = new Konva.Rect({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          fill: 'rgba(221, 33, 33, 0.55)',
          stroke: 'black',
          strokeWidth: 0.5,
          draggable: true
        });
        break;
        case 'free_draw':
          this.tempShape = new Konva.Line({
            x: pos.x,
            y: pos.y,
            points: [0, 0], 
            stroke: '#df4b26', 
            strokeWidth: 5,
            lineJoin: 'round',
            lineCap: 'round',
            mode: 'brush' ,
            draggable: true,
            closed: false,
          });
          console.log('Free draw line created, ');
          break; 
    }

    if (this.tempShape && this.layer) {
      this.layer.add(this.tempShape);
      this.layer.draw();
    }
  }

 
  updateDrawing(pos: { x: number; y: number }, shapeType: ShapeType): void {
    if (!this.tempShape || !this.startPos) return;

    const dx = pos.x - this.startPos.x;
    const dy = pos.y - this.startPos.y;

    switch (shapeType) {
      case 'circle':
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        (this.tempShape as Konva.Circle | Konva.RegularPolygon).radius(radius);
        break; 
        case 'arrow':
      if (this.tempShape instanceof Konva.Shape) {
        this.tempShape.setAttrs({
          endX: pos.x - this.tempShape.x(),
          endY: pos.y - this.tempShape.y(),
        });
        this.tempShape.draw();
      }
      break;

      case 'ellipse':
          const radiusX = Math.sqrt(dx * dx) / 2;
          (this.tempShape as Konva.Ellipse).radiusX(radiusX);
          const radiusY = Math.sqrt(dy * dy) / 2;
          (this.tempShape as Konva.Ellipse).radiusY(radiusY);
          break;
      case 'rectangle':
        (this.tempShape as Konva.Rect).width(dx);
        (this.tempShape as Konva.Rect).height(dy);
        break;
      case 'free_draw':
          const points = (this.tempShape as Konva.Line).points();
          const newPoints = points.concat([pos.x - this.tempShape.x(), pos.y - this.tempShape.y()]);
          (this.tempShape as Konva.Line).points(newPoints);
          console.log('Free draw updated, points:', newPoints);
      break;
   
    }

    if (this.layer) {
      this.layer.draw();
    }
  }

  finishDrawing(): Konva.Shape | Konva.Group | null {
    console.log('finishDrawing, shape:', this.tempShape);
    this.isDrawing = false;
    const completedShape = this.tempShape;
    this.tempShape = null;
    this.startPos = null;
    if (this.layer) {
      this.layer.batchDraw();
    }
    return completedShape;
  }

  
  reset(): void {
    this.tempShape = null;
    this.startPos = null;
    this.isDrawing = false;
  }

  
  
}
