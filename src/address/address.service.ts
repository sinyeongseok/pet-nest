import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Address, AddressDocument } from '../schema/address.schema';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name) private AddressModel: Model<AddressDocument>
  ) {}

  combineAddress({ siDo, eupMyeonDong, siGunGu = '', ri = '' }) {
    return [siDo, siGunGu, eupMyeonDong, ri]
      .join(' ')
      .replaceAll('  ', ' ')
      .trim();
  }

  convertAddressList(addressList: AddressDocument[]) {
    return addressList.map(({ coordinate, ...addressInfo }) => {
      const address = this.combineAddress(addressInfo);
      const [latitude, longitude] = coordinate.split(',');
      return {
        address,
        latitude,
        longitude,
      };
    });
  }

  async getNearbyAddresses(latitude: string, longitude: string) {
    const getDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const radLat1 = (Math.PI * lat1) / 180;
      const radLat2 = (Math.PI * lat2) / 180;
      const theta = lon1 - lon2;
      const radTheta = (Math.PI * theta) / 180;
      let dist =
        Math.sin(radLat1) * Math.sin(radLat2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515 * 1.609344 * 1000;
      if (dist < 100) {
        return Math.round(dist / 10) * 10;
      } else {
        return Math.round(dist / 100) * 100;
      }
    };

    try {
      const addressList = await this.AddressModel.find().lean();
      const nearbyAddressList = [];

      addressList.forEach((address) => {
        const [lat, lon] = address['coordinate'].split(',');
        const distance = getDistance(
          Number(latitude),
          Number(longitude),
          Number(lat),
          Number(lon)
        );
        if (distance <= 2000) {
          nearbyAddressList.push({ ...address, distance });
        }
      });

      const sortArray = nearbyAddressList.sort(
        (a, b) => a.distance - b.distance
      );
      const result = this.convertAddressList(sortArray);

      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async getAddress(address: string) {
    try {
      const regExp = new RegExp(`.*${address}.*`);
      const addressList = await this.AddressModel.find({
        ...(!!address && { eupMyeonDong: { $regex: regExp } }),
      }).lean();
      const result = this.convertAddressList(addressList);

      return result;
    } catch (error) {
      console.log(error);
    }
  }
}
