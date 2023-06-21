import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CityAddress, CityAddressDocument } from '../schema/cityAddress.schema';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(CityAddress.name)
    private CityAddressModel: Model<CityAddressDocument>
  ) {}

  convertAddressList(addressList) {
    return addressList.map(({ location, detail }) => {
      const [longitude, latitude] = location.coordinates;
      return {
        address: detail,
        latitude,
        longitude,
      };
    });
  }

  async getNearbyAddresses(latitude: string, longitude: string) {
    try {
      const addressList = await this.CityAddressModel.aggregate([
        {
          $geoNear: {
            maxDistance: 2000,
            near: {
              type: 'Point',
              coordinates: [Number(longitude), Number(latitude)],
            },
            distanceField: 'distance',
            key: 'location',
          },
        },
      ]);
      const result = this.convertAddressList(addressList);

      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async getAddress(address: string) {
    try {
      const regExp = new RegExp(`.*${address}.*`);
      const addressList = await this.CityAddressModel.find({
        ...(!!address && { eupMyeonDong: { $regex: regExp } }),
      }).lean();
      const result = this.convertAddressList(addressList);

      return result;
    } catch (error) {
      console.log(error);
    }
  }
}
