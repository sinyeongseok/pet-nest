import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Address {
  @Prop()
  code: number;

  @Prop()
  num: number;

  @Prop()
  siDo: string;

  @Prop()
  siGunGu: string;

  @Prop()
  eupMyeonDong: string;

  @Prop()
  ri: string;

  @Prop()
  coordinate: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
