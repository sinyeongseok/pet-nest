import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PetMateBoardDocument = PetMateBoard & Document;

@Schema({ versionKey: false })
export class PetMateBoard {
  @Prop()
  title: string;

  @Prop()
  host: string;

  @Prop()
  content: string;

  @Prop()
  date: Date;

  @Prop()
  place: string;

  @Prop()
  maxPet: number;

  @Prop()
  address: string;

  @Prop()
  addressDetail: string;

  @Prop({ required: true, default: '모집중' })
  status: '모집중' | '모집마감';

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

export const PetMateBoardSchema = SchemaFactory.createForClass(
  PetMateBoard
).index({
  location: '2dsphere',
});
