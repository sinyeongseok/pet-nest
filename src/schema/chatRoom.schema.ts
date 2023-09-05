import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

@Schema({
  versionKey: false,
})
export class ChatRoom {
  @Prop()
  boardId: string;

  @Prop([String])
  users: string[];

  @Prop()
  title: string;

  @Prop({ default: '' })
  lastChat: string;

  @Prop({ default: Date.now })
  lastChatAt: Date;

  @Prop()
  region: string;

  @Prop({ required: true, default: false })
  isPetMate: boolean;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
