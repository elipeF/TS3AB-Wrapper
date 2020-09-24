import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('/')
  async index(@Request() req) {
    return "Ok";
  }
}