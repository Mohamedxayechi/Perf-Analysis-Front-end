export class Complex2DShape {
    // Attributes
    id!: string;
    type!: 'complex';
    x!: number;
    y!: number;
    height!: number;
    width!: number;
    innerRadius!: number;
    outerRadius!: number;
    color!: string;
  
     shapes: Map<string, Complex2DShape> = new Map();
  
    // Methods
    async create(shape: Complex2DShape): Promise<boolean> {
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
  
    async update(id: string, properties: Partial<Complex2DShape>): Promise<boolean> {
      // To be implemented
      return Promise.resolve(false);
    }
  
    async get(id: string): Promise<Complex2DShape> {
      // To be implemented
      throw new Error('Not implemented');
    }
  }
  