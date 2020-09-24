import { Module, HttpModule } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { TomlReaderModule } from '../toml-reader/toml-reader.module';
import { RightsParserModule } from '../rights-parser/rights-parser.module';

@Module({
  controllers: [BotController],
  providers: [BotService],
  imports: [TomlReaderModule, HttpModule, RightsParserModule],
})
export class BotModule {}
