import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CityAddressDocument = CityAddress & Document;

@Schema({ versionKey: false })
export class CityAddress {
  @Prop()
  code: number;

  @Prop()
  num: number;

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

  @Prop(
    raw({
      type: { type: String },
      coordinates: { type: [Number] },
    })
  )
  location: {
    type: string;
    coordinates: number[];
  };
}

export const CityAddressSchema = SchemaFactory.createForClass(
  CityAddress
).index({
  location: '2dsphere',
});
