import Konva from 'konva';

// Mimic Konva's GetSet type
type GetSet<T, This> = {
  (): T;
  (value: T): This;
};

export interface BaseShape {
  id: string | GetSet<string, Konva.Node>;
  type:string;
  setPosition(pos: { x: number; y: number }): void | Konva.Node;
  setCustomProperty<K extends string, V>(key: K, value: V): void;
  getCustomProperty<K extends string, V>(key: K): V | undefined;
  destroy(): void;
}