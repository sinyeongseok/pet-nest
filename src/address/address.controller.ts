import { Controller, Get, Query } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  async getAddress(@Query('address') address: string) {
    const result = await this.addressService.getAddress(address);
    return { data: result };
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
    return { data: result };
  }
}
