import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { DragListService } from '../../../services/drag-list.service';

@Component({
    selector: 'app-item-list-menu',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, MatIconModule],
    templateUrl: './item-list-menu.component.html',
    styles: ``
})
export class ItemListMenuComponent {
  constructor(private dragListService: DragListService) {}
  @Input() index = 0;

  deleteItem() {
    this.dragListService.delete(this.index);
  }
  duplicateItem() {
    this.dragListService.duplicate(this.index);
  }
}
