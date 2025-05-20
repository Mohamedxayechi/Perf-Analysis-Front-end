// ====================
// src/app/models/custom-property-handler.ts
// ====================
type CustomProps = Map<string, unknown>;

/**
 * Handles storage and retrieval of custom properties.
 */
export class CustomPropertyHandler {
  private props: CustomProps = new Map();

  set<K extends string, V>(key: K, value: V): void {
    this.props.set(key, value);
  }

  /**
   * Gets a custom property.
   * Note: Uses type assertion. Ensure the correct type <V> is requested,
   * matching the type stored with the key <K>, to avoid runtime issues.
   */
  get<K extends string, V>(key: K): V | undefined {
    return this.props.get(key) as V | undefined;
  }

  clear(): void {
    this.props.clear();
  }
}
