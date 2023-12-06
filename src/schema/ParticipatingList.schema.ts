import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ParticipatingListDocument = ParticipatingList & Document;

@Schema({ versionKey: false })
export class ParticipatingList {
  @Prop({ type: 'ObjectId', ref: 'PetMate' })
  boardId: string;

  @Prop()
  userEmail: string;

  @Prop([{ type: 'ObjectId', ref: 'Pet' }])
  petIds: string[];

  @Prop()
  isHostPet: boolean;

  @Prop()
  message: string;

  @Prop({ required: true, default: false })
  isApproved: boolean;
}

export const ParticipatingListSchema =
  SchemaFactory.createForClass(ParticipatingList);
