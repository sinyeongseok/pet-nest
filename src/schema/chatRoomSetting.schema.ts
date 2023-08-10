import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatRoomSettingDocument = ChatRoomSetting & Document;

@Schema({
  versionKey: false,
})
export class ChatRoomSetting {
  @Prop()
  chatRoomId: string;

  @Prop()
  userId: string;

  @Prop()
  isAllam: boolean;

  @Prop()
  isPinned: boolean;
}

export const ChatRoomSettingSchema =
  SchemaFactory.createForClass(ChatRoomSetting);
