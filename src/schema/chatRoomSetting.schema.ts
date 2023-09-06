import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatRoomSettingDocument = ChatRoomSetting & Document;

@Schema({
  versionKey: false,
})
export class ChatRoomSetting {
  @Prop({ type: 'ObjectId', ref: 'ChatRoom' })
  chatRoomId: string;

  @Prop()
  userId: string;

  @Prop({ default: true })
  isAlarm: boolean;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isLeave: boolean;
}

export const ChatRoomSettingSchema =
  SchemaFactory.createForClass(ChatRoomSetting);
