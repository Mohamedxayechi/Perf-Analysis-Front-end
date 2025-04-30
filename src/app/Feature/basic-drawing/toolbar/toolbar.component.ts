import { Component } from '@angular/core';
import { ToolService } from '../services/tool.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  activeTool: string | null = null;

  tools = [
    {id: 'arrow', label: 'Flèche'},
    {id: 'circle', label: 'Cercle'},
    {id: 'ellipse', label: 'Ellipse'},
    {id: 'rectangle', label: 'Rectangle'},
    {id: 'lightbeam', label: 'Faisceau lumineux'},
    {id: 'polygon', label: 'Polygone'},
    {id: 'free_draw', label: 'Dessin libre'},
    {id: 'text', label: 'Texte'}
  ]
  
  private subscription: Subscription | null = null;

  constructor(private toolService: ToolService){}
  ngOnInit(): void {
    
    this.subscription = this.toolService.getActiveTool().subscribe(tool => {
      this.activeTool = tool;
     
    });
  }

  selectTool(toolId: string): void {
    if (this.activeTool === toolId) {
      this.toolService.setActiveTool(null);
      console.log('Tool deselected');
    } else {
      this.toolService.setActiveTool(toolId);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    
  }

  selectMode(): void {
    this.toolService.setActiveTool(null);
  }


}
