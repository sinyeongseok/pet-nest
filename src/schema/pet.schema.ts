import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PetDocument = Pet & Document;

@Schema({ versionKey: false })
export class Pet {
  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  images: string[];

  @Prop({ required: true })
  species: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop()
  gender: string;

  @Prop()
  neuteredStatus: string;

  @Prop()
  weight: number;

  @Prop()
  unusualCondition: string;

  @Prop()
  helloMessage: string;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
