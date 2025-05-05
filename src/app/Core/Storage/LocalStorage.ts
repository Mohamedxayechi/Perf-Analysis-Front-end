export class LocalStorage {
  public type: string = 'local';

  async create(data: { key: string; type: string; value: Record<string, any> }): Promise<boolean> {
    try {
      if (localStorage.getItem(data.key)) {
        return false; // Key already exists
      }
      localStorage.setItem(data.key, JSON.stringify(data.value));
      return true;
    } catch (error) {
      console.error(`Failed to create local storage item with key ${data.key}: ${error}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!localStorage.getItem(key)) {
        return false; // Key doesn't exist
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete local storage item with key ${key}: ${error}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return !!localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to check existence of local storage item with key ${key}: ${error}`);
      return false;
    }
  }

  async update(key: string, properties: Partial<Record<string, any>>): Promise<boolean> {
    try {
      const existing = localStorage.getItem(key);
      if (!existing) {
        return false; // Key doesn't exist
      }
      const currentValue = JSON.parse(existing) as Record<string, any>;
      const updatedValue = { ...currentValue, ...properties };
      localStorage.setItem(key, JSON.stringify(updatedValue));
      return true;
    } catch (error) {
      console.error(`Failed to update local storage item with key ${key}: ${error}`);
      return false;
    }
  }

  async get(key: string): Promise<{ key: string; type: string; value: Record<string, any> }> {
    try {
      const value = localStorage.getItem(key);
      if (!value) {
        throw new Error(`Data with key ${key} not found`);
      }
      return {
        key,
        type: this.type,
        value: JSON.parse(value) as Record<string, any>,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve local storage item with key ${key}: ${error}`);
    }
  }
}