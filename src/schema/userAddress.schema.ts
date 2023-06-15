import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserAddressDocument = UserAddress & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  versionKey: false,
})
export class UserAddress {
  @Prop()
  userEmail: string;

  @Prop()
  detail: string;

  @Prop()
  siDo: string;

  @Prop()
  siGunGu: string;

  @Prop()
  eupMyeonDong: string;

  @Prop()
  ri: string;

  @Prop()
  longitude: string;

  @Prop()
  latitude: string;

  @Prop()
  isLastSelected: boolean;

  @Prop()
  isAuth: boolean;
}

export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);
