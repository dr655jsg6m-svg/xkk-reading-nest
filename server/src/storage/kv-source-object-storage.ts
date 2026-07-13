import {
  SourceObjectNotFoundError,
  sourceBytesToArrayBuffer,
  type SourceObjectStorage
} from "./source-object-storage.js";

type KvObjectMetadata = {
  contentType?: string;
  sizeBytes: number;
  customMetadata?: Record<string, string>;
};

/** Private source storage for the personal deployment. */
export class KvSourceObjectStorage implements SourceObjectStorage {
  constructor(private readonly namespace: KVNamespace) {}

  async putObject(input: {
    key: string;
    bytes: Uint8Array | ArrayBuffer | Blob;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{ key: string; sizeBytes: number }> {
    const bytes = await sourceBytesToArrayBuffer(input.bytes);
    const metadata: KvObjectMetadata = {
      sizeBytes: bytes.byteLength,
      ...(input.contentType ? { contentType: input.contentType } : {}),
      ...(input.metadata ? { customMetadata: input.metadata } : {})
    };
    await this.namespace.put(input.key, bytes, { metadata });
    return { key: input.key, sizeBytes: bytes.byteLength };
  }

  async getObject(key: string): Promise<{
    bytes: ArrayBuffer;
    contentType?: string;
    sizeBytes?: number;
  }> {
    const object = await this.namespace.getWithMetadata<KvObjectMetadata>(key, {
      type: "arrayBuffer"
    });
    if (!object.value) throw new SourceObjectNotFoundError(key);
    return {
      bytes: object.value,
      ...(object.metadata?.contentType
        ? { contentType: object.metadata.contentType }
        : {}),
      sizeBytes: object.metadata?.sizeBytes ?? object.value.byteLength
    };
  }

  async headObject(key: string): Promise<{
    exists: boolean;
    contentType?: string;
    sizeBytes?: number;
  }> {
    const object = await this.namespace.getWithMetadata<KvObjectMetadata>(key, {
      type: "arrayBuffer"
    });
    if (!object.value) return { exists: false };
    return {
      exists: true,
      ...(object.metadata?.contentType
        ? { contentType: object.metadata.contentType }
        : {}),
      sizeBytes: object.metadata?.sizeBytes ?? object.value.byteLength
    };
  }

  async deleteObject(key: string): Promise<{ deleted: boolean }> {
    const exists = (await this.namespace.get(key, "arrayBuffer")) !== null;
    if (exists) await this.namespace.delete(key);
    return { deleted: exists };
  }
}
