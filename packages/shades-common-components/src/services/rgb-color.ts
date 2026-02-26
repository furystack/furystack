/**
 * Represents an RGBA color with mutable channels.
 */
export class RgbColor {
  constructor(
    public r: number,
    public g: number,
    public b: number,
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
