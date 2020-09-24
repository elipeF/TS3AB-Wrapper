import { Module } from '@nestjs/common';
import { RightsParserService } from './rights-parser.service';

@Module({
  providers: [RightsParserService],
  exports: [RightsParserService],
})
export class RightsParserModule {}
