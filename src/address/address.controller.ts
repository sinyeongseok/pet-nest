import { Controller, Get, Query } from '@nestjs/common';
import { AddressService } from './address.service';
import { Address } from './address.model';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get()
  getAddress(@Query('address') address: string) {
    return this.addressService.getAddress(address);
  }

  @Get('nearby')
  getNearbyAddress(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string
  ) {
    return this.addressService.getNearbyAddresses(latitude, longitude);
  }
}
