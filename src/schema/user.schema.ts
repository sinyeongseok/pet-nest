import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  versionKey: false,
})
export class User {
  @Prop({ required: true })
  email: string;

  @Prop()
  nickname: string;

  @Prop()
  profileImage: string;

  @Prop()
  petType: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
