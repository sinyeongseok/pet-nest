import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

type MessageType = 'message' | 'action';
type MessageDetailType =
  | 'usedTrade'
  | 'petMate'
  | 'schedule_cancel'
  | 'join'
  | 'exit'
  | 'mate_cancel';

interface MessageDetails {
  type: MessageDetailType;
  sender: string;
  content: string;
  timestamp: string;
}

@Schema({
  versionKey: false,
})
export class Message {
  @Prop({ type: 'ObjectId', ref: 'ChatRoom' })
  chatRoomId: string;

  @Prop()
  type: MessageType;

  @Prop({
    type: Object,
    required: true,
    default: () => ({
      sender: '',
      content: '',
      timestamp: Date.now,
    }),
  })
  details: MessageDetails;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
