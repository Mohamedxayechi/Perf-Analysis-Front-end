import Konva from 'konva';
import { Simple2DShape } from '../Simple2DShape';
import { BaseShape } from './BaseShape';

type KonvaNodeConstructor<T extends Konva.Node = Konva.Node> = new (...args: any[]) => T;

export function Simple2DShapeMixin<TBase extends KonvaNodeConstructor<Konva.Shape>>(
  Base: TBase
) {
  class Mixed extends Simple2DShape {
    constructor(config: Konva.ShapeConfig & ConstructorParameters<TBase>[0] & { id: string }) {
      super(config as Konva.ShapeConfig & { id: string });
      const konvaInstance = new Base(config as ConstructorParameters<TBase>[0]);
      Object.assign(this, konvaInstance);
    }

    override setPosition(pos: { x: number; y: number }): this {
      super.setPosition(pos);
      return this;
    }
  }

  return Mixed as unknown as new (
    config: Konva.ShapeConfig & ConstructorParameters<TBase>[0] & { id: string }
  ) => Simple2DShape & BaseShape & InstanceType<TBase>;
}