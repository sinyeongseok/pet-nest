import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PetMateBoardDocument = PetMateBoard & Document;

@Schema({ versionKey: false })
export class PetMateBoard {
  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  date: Date;

  @Prop()
  place: string;

  @Prop()
  maxPet: number;
}

export const PetMateBoardSchema = SchemaFactory.createForClass(PetMateBoard);
