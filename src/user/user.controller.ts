import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Express, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAccessAuthGuard } from 'src/common/guards/jwtAccessAuthGuard.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  async createProfile(
    @UploadedFile() file,
    @Body('email') email: string,
    @Body('nickname') nickname: string,
    @Body('petType') petType: string,
    @Body('address') address: string
  ) {
    const result = await this.userService.createProfile(file, {
      email,
      nickname,
      petType,
      address,
    });

    return { data: result };
  }

  @Post('addresses')
  @UseGuards(JwtAccessAuthGuard)
  async createUserAddress(
    @Res() res,
    @Req() req,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number
  ) {
    const email = req.user.email;
    const result = await this.userService.createUserAddress(email, {
      latitude,
      longitude,
    });

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('addresses/:id')
  @UseGuards(JwtAccessAuthGuard)
  async updateAddressLastSelected(
    @Res() res,
    @Req() req,
    @Param('id') id: string
  ) {
    const email = req.user.email;
    const result = await this.userService.updateAddressLastSelected(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAccessAuthGuard)
  async deleteAddress(@Res() res, @Req() req, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.userService.deleteAddress(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('addresses')
  @UseGuards(JwtAccessAuthGuard)
  async getUserAddresses(@Res() res, @Req() req) {
    const email = req.user.email;
    const result = await this.userService.getUserAddresses(email, null);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('addresses/settings')
  @UseGuards(JwtAccessAuthGuard)
  async getUserAddressesSettings(@Res() res, @Req() req) {
    const email = req.user.email;
    const result = await this.userService.getUserAddresses(email, 'settings');

    return res.status(result.statusCode).json(result.data);
  }

  @Get('random-nickname')
  async getRandomNickname() {
    const result = await this.userService.getRandomNickname();
    return { data: { randomNickname: result } };
  }
}
