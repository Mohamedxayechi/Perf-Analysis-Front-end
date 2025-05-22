import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Engine } from '../../../../../Core/Engine';

@Component({
    selector: 'app-item-list-menu',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, MatIconModule],
    templateUrl: './item-list-menu.component.html',
    styles: ``
})
export class ItemListMenuComponent {
  @Input() index = 0;

  /**
   * Emits an event to delete the media item at the specified index.
   */
  deleteItem() {
    Engine.getInstance().emit({
      type: 'ItemListMenuComponent.media.delete',
      data: { index: this.index },
      origin: 'component',
      processed: false
    });
  }

  /**
   * Emits an event to duplicate the media item at the specified index and logs the index.
   */
  duplicateItem() {
    Engine.getInstance().emit({
      type: 'ItemListMenuComponent.media.duplicate',
      data: { index: this.index },
      origin: 'component',
      processed: false
    });
    console.log(this.index);
  }
}