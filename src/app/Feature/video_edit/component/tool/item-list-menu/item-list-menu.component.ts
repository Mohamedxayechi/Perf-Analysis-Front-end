import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Engine } from '../../../../../Core/Engine'; // Adjust path as needed

@Component({
    selector: 'app-item-list-menu',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, MatIconModule],
    templateUrl: './item-list-menu.component.html',
    styles: ``
})
export class ItemListMenuComponent {
  @Input() index = 0;

  deleteItem() {
    Engine.getInstance().emit({
      type: 'media.delete',
      data: { index: this.index },
      origin: 'component',
      processed: false
    });
  }

  duplicateItem() {
    Engine.getInstance().emit({
      type: 'media.duplicate',
      data: { index: this.index },
      origin: 'component',
      processed: false
    });
    console.log(this.index);
  }
}