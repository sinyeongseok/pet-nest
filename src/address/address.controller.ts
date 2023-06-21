import { Controller, Get, Query } from '@nestjs/common';
import { AddressService } from './address.service';
import { DATE_FORMAT } from '../config/constants';
import * as dayjs from 'dayjs';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get('test')
  async test() {
    return this.addressService.test();
  }

  @Get()
  async getAddress(@Query('address') address: string) {
    const result = await this.addressService.getAddress(address);
    return { data: result, dataTimestamp: dayjs().format(DATE_FORMAT) };
  }

  @Get('nearby')
  async getNearbyAddress(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string
  ) {
    const result = await this.addressService.getNearbyAddresses(
      latitude,
      longitude
    );
    return { data: result, dataTimestamp: dayjs().format(DATE_FORMAT) };
  }
}
