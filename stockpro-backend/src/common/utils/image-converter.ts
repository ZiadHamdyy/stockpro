/**
 * Utility functions for converting between base64 strings and Buffer objects
 * for image storage in the database
 */

/**
 * Converts a base64 string to a Buffer
 * Handles data URI prefixes (data:image/png;base64,...)
 * @param base64 - Base64 string, optionally with data URI prefix
 * @returns Buffer containing the image data, or null if input is empty
 */
export function base64ToBuffer(base64: string): Buffer | null {
  if (!base64) {
    return null;
  }

  // Remove data URI prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Convert base64 to buffer
  return Buffer.from(base64Data, 'base64');
}

/**
 * Converts a Buffer to a base64 string
 * @param buffer - Buffer containing image data
 * @returns Base64 string representation of the image, or null if buffer is empty
 */
export function bufferToBase64(buffer: Buffer | null): string | null {
  if (!buffer) {
    return null;
  }

  return buffer.toString('base64');
}

/**
 * Detects the MIME type from image buffer data
 * @param buffer - Buffer containing image data
 * @returns MIME type string or 'image/png' as default
 */
function detectMimeType(buffer: Buffer): string {
  // Check for common image file signatures
  const bytes = buffer.subarray(0, 4);

  // PNG signature: 89 50 4E 47
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }

  // JPEG signature: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // GIF signature: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WebP signature: 52 49 46 46 (RIFF) followed by 57 45 42 50 (WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    const webpBytes = buffer.subarray(8, 12);
    if (
      webpBytes[0] === 0x57 &&
      webpBytes[1] === 0x45 &&
      webpBytes[2] === 0x42 &&
      webpBytes[3] === 0x50
    ) {
      return 'image/webp';
    }
  }

  // Default to PNG if we can't detect
  return 'image/png';
}

/**
 * Converts a Buffer to a data URI string
 * @param buffer - Buffer containing image data
 * @param mimeType - MIME type of the image (optional, will auto-detect if not provided)
 * @returns Data URI string (data:image/png;base64,...), or null if buffer is empty
 */
export function bufferToDataUri(
  buffer: Buffer | null | { type: string; data: number[] } | number[] | Uint8Array | Record<string, unknown>,
  mimeType?: string,
): string | null {
  if (!buffer) {
    return null;
  }

  // Type guard for JSON serialized Buffer
  const isJsonBuffer = (b: Buffer | { type: string; data: number[] } | number[] | Uint8Array | Record<string, unknown>): b is { type: string; data: number[] } => {
    return (
      typeof b === 'object' &&
      b !== null &&
      'type' in b &&
      'data' in b &&
      (b as { type: unknown }).type === 'Buffer' &&
      Array.isArray((b as { data: unknown }).data)
    );
  };

  console.log('🔍 bufferToDataUri called with:', {
    type: typeof buffer,
    isBuffer: Buffer.isBuffer(buffer),
    hasType: isJsonBuffer(buffer) ? buffer.type : 'N/A',
    isArray: Array.isArray(buffer),
    length:
      Buffer.isBuffer(buffer) || Array.isArray(buffer)
        ? buffer.length
        : isJsonBuffer(buffer)
          ? buffer.data.length
          : 'no length',
    firstFew: Array.isArray(buffer) ? buffer.slice(0, 5) : 'not array',
  });

  let bufferData: Buffer;

  // Handle different Buffer formats
  if (Buffer.isBuffer(buffer)) {
    bufferData = buffer;
  } else if (isJsonBuffer(buffer)) {
    // Handle JSON serialized Buffer: { type: 'Buffer', data: [137, 80, 78, 71, ...] }
    console.log(
      '🔍 Converting JSON serialized Buffer, data length:',
      buffer.data.length,
    );
    bufferData = Buffer.from(buffer.data);
  } else if (Array.isArray(buffer)) {
    // Handle direct array of bytes
    console.log('🔍 Converting direct array, length:', buffer.length);
    bufferData = Buffer.from(buffer);
  } else if (buffer instanceof Uint8Array) {
    // Handle Uint8Array
    console.log('🔍 Converting Uint8Array, length:', buffer.length);
    bufferData = Buffer.from(buffer);
  } else {
    // Try to convert whatever it is
    console.log('🔍 Fallback conversion');
    // Type assertion needed for fallback - cast through unknown first
    bufferData = Buffer.from(buffer as unknown as string | ArrayLike<number>);
  }

  const detectedMimeType = mimeType || detectMimeType(bufferData);
  const base64 = bufferData.toString('base64');
  const result = `data:${detectedMimeType};base64,${base64}`;

  console.log('🔍 Generated data URI length:', result.length);
  console.log('🔍 Generated data URI preview:', result.substring(0, 50));

  return result;
}

/**
 * Checks if a string is a valid base64 image
 * @param str - String to check
 * @returns true if the string appears to be a valid base64 image
 */
export function isValidBase64Image(str: string): boolean {
  if (!str) return false;

  // Check if it's a data URI
  if (str.startsWith('data:image/')) {
    return str.includes('base64,');
  }

  // Check if it's plain base64 (basic validation)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length > 0;
}
