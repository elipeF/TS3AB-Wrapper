import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Patch,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { Bot } from './../bot';
import { RightsRequest } from '../rights-request';
import { BotEdit } from 'src/bot-edit';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get(':id/server')
  async server(@Param() params: Bot) {
    return this.botService.server(params.id);
  }

  @Get(':id/rights')
  async getRights(@Param() params: Bot) {
    return this.botService.rights(params.id);
  }

  @Post(':id/rights')
  async addRights(@Param() params: Bot, @Body() rights: RightsRequest) {
    return this.botService.addRights(params.id, rights);
  }

  @Patch(':id/rights')
  async removeRights(@Param() params: Bot, @Body() rights: RightsRequest) {
    return this.botService.removeRights(params.id, rights);
  }

  @Delete(':id')
  async delete(@Param() params: Bot) {
    return this.botService.remove(params.id);
  }

  @Post('/')
  async createBot(@Body() bot: Bot) {
    return this.botService.create(bot.id);
  }

  @Get('/count')
  async botCount() {
    return this.botService.count();
  }

  @Get(':id/start')
  async on(@Param() params: Bot) {
    return this.botService.on(params.id);
  }

  @Get(':id/stop')
  async off(@Param() params: Bot) {
    return this.botService.off(params.id);
  }

  @Get(':id')
  async getInfo(@Param() params: Bot) {
    return this.botService.getInf(params.id);
  }

  @Patch(':id')
  async edit(@Param() params: Bot, @Body() settings: BotEdit) {
    return this.botService.edit(params.id, settings);
  }
}
