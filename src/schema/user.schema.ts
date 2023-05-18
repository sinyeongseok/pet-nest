import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User {
  @Prop()
  email: string;

  @Prop()
  nickname: string;

  @Prop()
  profileImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
