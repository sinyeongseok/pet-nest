import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

type Address = {
  detail: string;
  longitude: string;
  latitude: string;
};

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User {
  @Prop()
  email: string;

  @Prop()
  nickname: string;

  @Prop()
  profileImage: string;

  @Prop()
  refreshToken: string;

  @Prop()
  petType: string;

  @Prop({ type: Object })
  address: Address;
}

export const UserSchema = SchemaFactory.createForClass(User);
