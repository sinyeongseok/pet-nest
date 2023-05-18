import { Controller, Get, Query } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  async getAddress(@Query('address') address: string) {
    return await this.addressService.getAddress(address);
  }

  @Get('nearby')
  async getNearbyAddress(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string
  ) {
    return await this.addressService.getNearbyAddresses(latitude, longitude);
  }
}
