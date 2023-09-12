import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsedItemScheduleDocument = UsedItemSchedule & Document;

@Schema({
  versionKey: false,
})
export class UsedItemSchedule {
  @Prop({ type: 'ObjectId', ref: 'ChatRoom' })
  chatRoomId: string;

  @Prop({ required: true })
  promiseAt: Date;

  @Prop()
  content: string;

  @Prop({ default: false })
  isAlarm: boolean;

  @Prop()
  alarmAt: Date;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const UsedItemScheduleSchema =
  SchemaFactory.createForClass(UsedItemSchedule);
