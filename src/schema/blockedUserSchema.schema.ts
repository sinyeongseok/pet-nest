import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockedUserDocument = BlockedUser & Document;

@Schema({ versionKey: false })
export class BlockedUser {
  @Prop()
  userId: string;

  @Prop()
  blockedBy: string;

  @Prop({ default: Date.now })
  blockedAt: Date;
}

export const BlockedUserSchema = SchemaFactory.createForClass(BlockedUser);
