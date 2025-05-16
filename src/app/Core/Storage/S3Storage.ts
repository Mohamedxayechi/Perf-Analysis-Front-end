import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class S3Storage {
  public type: string = 's3';
  public client: S3Client;
  public bucket: string = 'your-bucket-name'; // Replace with your S3 bucket name

  constructor() {
    this.client = new S3Client({
      region: 'your-region', // Replace with your AWS region, e.g., 'us-east-1'
      credentials: {
        accessKeyId: 'your-access-key', // Replace with your AWS access key
        secretAccessKey: 'your-secret-key', // Replace with your AWS secret key
      },
    });
  }

  async create(data: { key: string; type: string; value: Record<string, any> }): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: data.key,
        Body: JSON.stringify(data.value),
        ContentType: 'application/json',
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error(`Failed to create S3 object with key ${data.key}: ${error}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error(`Failed to delete S3 object with key ${key}: ${error}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      return false; // Key doesn't exist
    }
  }

  async update(key: string, properties: Partial<Record<string, any>>): Promise<boolean> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const { Body } = await this.client.send(getCommand);
      if (!Body) {
        return false; // Key doesn't exist
      }
      const currentValue = JSON.parse(await Body.transformToString()) as Record<string, any>;
      const updatedValue = { ...currentValue, ...properties };
      const putCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(updatedValue),
        ContentType: 'application/json',
      });
      await this.client.send(putCommand);
      return true;
    } catch (error) {
      console.error(`Failed to update S3 object with key ${key}: ${error}`);
      return false;
    }
  }

  async get(key: string): Promise<{ key: string; type: string; value: Record<string, any> }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const { Body } = await this.client.send(command);
      if (!Body) {
        throw new Error(`Data with key ${key} not found`);
      }
      const value = JSON.parse(await Body.transformToString()) as Record<string, any>;
      return {
        key,
        type: this.type,
        value,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve S3 object with key ${key}: ${error}`);
    }
  }
}