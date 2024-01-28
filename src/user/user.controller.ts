import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
    @Req() req,
    @Res() res,
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
    @Req() req,
    @Res() res,
    @Param('id') id: string
  ) {
    const email = req.user.email;
    const result = await this.userService.updateAddressLastSelected(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAccessAuthGuard)
  async deleteAddress(@Req() req, @Res() res, @Param('id') id: string) {
    const email = req.user.email;
    const result = await this.userService.deleteAddress(email, id);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('addresses')
  @UseGuards(JwtAccessAuthGuard)
  async getUserAddresses(@Req() req, @Res() res) {
    const email = req.user.email;
    const result = await this.userService.getUserAddresses(email, null);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('addresses/settings')
  @UseGuards(JwtAccessAuthGuard)
  async getUserAddressesSettings(@Req() req, @Res() res) {
    const email = req.user.email;
    const result = await this.userService.getUserAddresses(email, 'settings');

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('nickname')
  @UseGuards(JwtAccessAuthGuard)
  async updateNickname(
    @Req() req,
    @Res() res,
    @Body('nickname') nickname: string
  ) {
    const email = req.user.email;
    const result = await this.userService.updateNickname(email, nickname);

    return res.status(result.statusCode).json(result.data);
  }

  @Post('pet')
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FilesInterceptor('petImages', 5))
  async createPet(
    @Req() req,
    @Res() res,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() petInfo
  ) {
    const email = req.user.email;
    const result = await this.userService.createPet(email, files, petInfo);

    return res.status(result.statusCode).json(result.data);
  }

  @Get('blocked')
  @UseGuards(JwtAccessAuthGuard)
  async getBlockList(@Req() req, @Res() res) {
    const email = req.user.email;
    const result = await this.userService.getBlockedUserList(email);

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('block')
  @UseGuards(JwtAccessAuthGuard)
  async blockUser(@Req() req, @Res() res, @Body('blockedBy') blockedBy) {
    const email = req.user.email;
    const result = await this.userService.blockUser(email, blockedBy);

    return res.status(result.statusCode).json(result.data);
  }

  @Patch('unblock')
  @UseGuards(JwtAccessAuthGuard)
  async unblockUser(@Req() req, @Res() res, @Body('blockedBy') blockedBy) {
    const email = req.user.email;
    const result = await this.userService.unblockUser(email, blockedBy);

    return res.status(result.statusCode).json(result.data);
  }
}
