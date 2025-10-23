// TLV to Base64 encoder for ZATCA e-invoicing QR code.

const textEncoder = new TextEncoder();

function buildTlv(tag: number, value: string): Uint8Array {
    const valueBytes = textEncoder.encode(value);
    const tagBytes = new Uint8Array([tag]);
    const lengthBytes = new Uint8Array([valueBytes.length]);

    const tlv = new Uint8Array(tagBytes.length + lengthBytes.length + valueBytes.length);
    tlv.set(tagBytes, 0);
    tlv.set(lengthBytes, tagBytes.length);
    tlv.set(valueBytes, tagBytes.length + lengthBytes.length);
    return tlv;
}

export function generateZatcaBase64(
    sellerName: string,
    vatNumber: string,
    timestamp: string, // ISO 8601 format with Z
    invoiceTotal: string, // "100.00"
    vatTotal: string // "15.00"
): string {
    const tlv1 = buildTlv(1, sellerName);
    const tlv2 = buildTlv(2, vatNumber);
    const tlv3 = buildTlv(3, timestamp);
    const tlv4 = buildTlv(4, invoiceTotal);
    const tlv5 = buildTlv(5, vatTotal);

    const combined = new Uint8Array(
        tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length
    );
    combined.set(tlv1, 0);
    combined.set(tlv2, tlv1.length);
    combined.set(tlv3, tlv1.length + tlv2.length);
    combined.set(tlv4, tlv1.length + tlv2.length + tlv3.length);
    combined.set(tlv5, tlv1.length + tlv2.length + tlv3.length + tlv4.length);

    let binaryString = '';
    combined.forEach((byte) => {
        binaryString += String.fromCharCode(byte);
    });

    return btoa(binaryString);
}
