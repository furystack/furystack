/**
 * OData v4 specified primitive types
 * http://docs.oasis-open.org/odata/odata/v4.0/odata-v4.0-part3-csdl.html
 */
export enum EdmType {
  /**
   *  Not set
   */
  Unknown,

  /** Binary data */
  Binary,

  /** Binary-valued logic */
  Boolean,

  /** Unsigned 8-bit integer */
  Byte,

  /** Date without a time-zone offset */
  DateTime,

  /** Date and time with a time-zone offset, no leap seconds */
  DateTimeOffset,

  /** Numeric values with fixed precision and scale */
  Decimal,

  /** IEEE 754 binary64 floating-point number (15-17 decimal digits) */
  Double,

  /** Signed duration in days, hours, minutes, and (sub)seconds */
  Duration,

  /** 16-byte (128-bit) unique identifier */
  Guid,

  /** Signed 16-bit integer */
  Int16,

  /** Signed 32-bit integer */
  Int32,

  /** Signed 64-bit integer */
  Int64,

  /** Signed 8-bit integer */
  SByte,

  /** IEEE 754 binary32 floating-point number (6-9 decimal digits) */
  Single,

  /** Binary data stream */
  Stream,

  /** Sequence of UTF-8 characters */
  String,

  /** Clock time 00:00-23:59:59.999999999999 */
  TimeOfDay,

  /** Abstract base type for all Geography types */
  Geography,

  /** A point in a round-earth coordinate system */
  GeographyPoint,

  /** Line string in a round-earth coordinate system */
  GeographyLineString,

  /** Polygon in a round-earth coordinate system */
  GeographyPolygon,

  /** Collection of points in a round-earth coordinate system */
  GeographyMultiPoint,

  /** Collection of line strings in a round-earth coordinate system */
  GeographyMultiLineString,

  /** Collection of polygons in a round-earth coordinate system */
  GeographyMultiPolygon,

  /** Collection of arbitrary Geography values */
  GeographyCollection,

  /** Abstract base type for all Geometry types */
  Geometry,

  /** Point in a flat-earth coordinate system */
  GeometryPoint,

  /** Line string in a flat-earth coordinate system */
  GeometryLineString,

  /** Polygon in a flat-earth coordinate system */
  GeometryPolygon,

  /** Collection of points in a flat-earth coordinate system */
  GeometryMultiPoint,

  /** Collection of line strings in a flat-earth coordinate system */
  GeometryMultiLineString,

  /** Collection of polygons in a flat-earth coordinate system */
  GeometryMultiPolygon,

  /** Collection of arbitrary Geometry values */
  GeometryCollection,
}
