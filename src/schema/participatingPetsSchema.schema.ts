import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type participatingPetsDocument = participatingPets & Document;

@Schema({ versionKey: false })
export class participatingPets {
  @Prop({ type: 'ObjectId', ref: 'PetMate' })
  boardId: string;

  @Prop()
  userEmail: string;

  @Prop([{ type: 'ObjectId', ref: 'Pet' }])
  petIds: string[];

  @Prop()
  isHostPet: boolean;
}

export const participatingPetsSchema =
  SchemaFactory.createForClass(participatingPets);
