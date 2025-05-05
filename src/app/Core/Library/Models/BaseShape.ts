//\src\app\Core\Library\Models\BaseShape.ts
// ====================
export interface BaseShape {
  id: string;
  // x() and y() are inherited from Konva.Node
  setPosition(x: number, y: number): void;
  setCustomProperty<K extends string, V>(key: K, value: V): void;
  getCustomProperty<K extends string, V>(key: K): V | undefined;
  destroy(): void;
}
