import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Address, AddressDocument } from '../schema/address.schema';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name) private AddressModel: Model<AddressDocument>
  ) {}
  async getNearbyAddresses(latitude: string, longitude: string) {
    const getDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      if (lat1 == lat2 && lon1 == lon2) {
        return 0;
      }
      let radLat1 = (Math.PI * lat1) / 180;
      let radLat2 = (Math.PI * lat2) / 180;
      let theta = lon1 - lon2;
      let radTheta = (Math.PI * theta) / 180;
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
        dist = Math.round(dist / 10) * 10;
      } else {
        dist = Math.round(dist / 100) * 100;
      }
      return dist;
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

      const result = nearbyAddressList
        .sort((a, b) => a.distance - b.distance)
        .map((addressInfo) => {
          const address = `${addressInfo['siDo']} ${addressInfo['siGunGu']} ${
            addressInfo['eupMyeonDong']
          } ${!!addressInfo['ri'] ? addressInfo['ri'] : ''}`.trim();
          const [latitude, longitude] = addressInfo['coordinate'].split(',');
          return {
            address,
            latitude,
            longitude,
          };
        });
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

      const result = addressList.map((addressInfo) => {
        const address = `${addressInfo['siDo']} ${addressInfo['siGunGu']} ${
          addressInfo['eupMyeonDong']
        } ${!!addressInfo['ri'] ? addressInfo['ri'] : ''}`.trim();
        const [latitude, longitude] = addressInfo['coordinate'].split(',');

        return { address, latitude, longitude };
      });
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}
