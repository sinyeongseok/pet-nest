import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({
  versionKey: false,
})
export class Message {
  @Prop({ type: 'ObjectId', ref: 'ChatRoom' })
  chatRoomId: string;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
