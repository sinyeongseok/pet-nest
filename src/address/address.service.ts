import { Injectable } from '@nestjs/common';
import { ADDRESS_INFO } from './address.json';
import { Address } from './address.model';

@Injectable()
export class AddressService {
  getNearbyAddresses(latitude: string, longitude: string): Address[] {
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

    const test: {
      distance: number;
      법정동코드: number;
      주소수: number;
      시도: string;
      시군구: string;
      읍면동: string;
      리: string;
      '위도,경도': string;
    }[] = [];

    ADDRESS_INFO.forEach((address) => {
      const [lat, lon] = address['위도,경도'].split(',');
      const distance = getDistance(
        Number(latitude),
        Number(longitude),
        Number(lat),
        Number(lon)
      );

      if (distance <= 2000) {
        test.push({ ...address, distance });
      }
    });

    const result = test
      .sort((a, b) => a.distance - b.distance)
      .map((t) => {
        const address = `${t['시도']} ${t['시군구']} ${t['읍면동']} ${
          !!t['리'] ? t['리'] : ''
        }`.trim();
        const [latitude, longitude] = t['위도,경도'].split(',');
        return {
          address,
          latitude,
          longitude,
        };
      });

    return result;
  }

  getAddress(address: string) {
    console.log(address);
    const findAddress = ADDRESS_INFO.filter(
      (info) => info['읍면동'] == address
    );
    const add: string = `${findAddress[0]['시도']} ${
      findAddress[0]['시군구']
    } ${findAddress[0]['읍면동']} ${
      !!findAddress[0]['리'] ? findAddress[0]['리'] : ''
    }`.trim();
    const [latitude, longitude] = findAddress[0]['위도,경도'].split(',');
    return { latitude, longitude, address: add };
  }
}
