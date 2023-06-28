import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandOutput,
  DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AwsService {
  private readonly awsS3: S3Client;
  public readonly S3_BUCKET_NAME: string;

  constructor() {
    this.awsS3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.S3_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
  }

  async uploadFileToS3(
    key: string,
    file: Express.Multer.File
  ): Promise<{
    key: string;
    s3Object: PutObjectCommandOutput;
    contentType: string;
    url: string;
  }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype,
      });
      const s3Object = await this.awsS3.send(command);
      const imgUrl = `https://${this.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
      return { key, s3Object, contentType: file.mimetype, url: imgUrl };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async deleteS3Object(
    key: string,
    callback?: (err: Error, data: DeleteObjectCommandOutput) => void
  ): Promise<{ success: true }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.S3_BUCKET_NAME,
        Key: key,
      });
      await this.awsS3.send(command);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  public getAwsS3FileUrl(objectKey: string) {
    return `https://${this.S3_BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;
  }
}
