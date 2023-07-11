import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsedItemBoardDocument = UsedItemBoard & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  versionKey: false,
})
export class UsedItemBoard {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  topCategory: string;

  @Prop()
  subCategory: string;

  @Prop()
  seller: string;

  @Prop()
  address: string;

  @Prop()
  addressDetail: string;

  @Prop([String])
  images: string[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop([String])
  viewedUsers: string[];

  @Prop({ default: '판매중' })
  salesStatus: '판매중' | '예약중' | '판매완료';

  @Prop({ default: false })
  isVisible: boolean;
}

export const UsedItemBoardSchema = SchemaFactory.createForClass(UsedItemBoard);
