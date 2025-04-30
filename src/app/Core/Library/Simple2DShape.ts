export class Simple2DShape {
    // Attributes
    id!: string;
    type!: 'simple';
    x!: number;
    y!: number;
    height!: number;
    width!: number;
    color!: string;
  
     shapes: Map<string, Simple2DShape> = new Map();
  
    // Methods
    async create(shape: Simple2DShape): Promise<boolean> {
      // To be implemented
      return Promise.resolve(false);
    }
  
    async delete(id: string): Promise<boolean> {
      // To be implemented
      return Promise.resolve(false);
    }
  
    async isSelected(id: string): Promise<boolean> {
      // To be implemented
      return Promise.resolve(false);
    }
  
    async update(id: string, properties: Partial<Simple2DShape>): Promise<boolean> {
      // To be implemented
      return Promise.resolve(false);
    }
  
    async get(id: string): Promise<Simple2DShape> {
      // To be implemented
      throw new Error('Not implemented');
    }
  }