/**
 * Represents an RGBA color with mutable channels.
 * The RGB
 */
export class RgbColor {
  constructor(
    /**
     * The Red component in a 0-255 range
     */
    public r: number,
    /**
     * The Green component, in a 0-255 range
     */
    public g: number,
    /**
     * The Blue component, in a 0-255 range
     */
    public b: number,
    /**
     * The alpha value in a 0-1 floating point value
     */
    public a: number = 1,
  ) {}

  public update(key: 'r' | 'g' | 'b' | 'a', value: number): RgbColor {
    this[key] = value
    return this
  }

  public toString(): string {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`
  }
}
