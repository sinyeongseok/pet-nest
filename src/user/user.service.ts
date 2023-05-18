import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Address, AddressDocument } from '../schema/address.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Address.name) private AddressModel: Model<AddressDocument>
  ) {}
}
