import { Module } from '@nestjs/common';
import { TomlReaderService } from './toml-reader.service';

@Module({
  providers: [TomlReaderService],
  exports: [TomlReaderService],
})
export class TomlReaderModule {}
