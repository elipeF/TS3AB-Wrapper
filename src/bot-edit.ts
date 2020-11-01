import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class BotEdit {
  @IsOptional()
  @IsIn(['en', 'pl', 'cs', 'da', 'fr', 'de', 'hu', 'ru', 'es', 'es-ar', 'th'])
  readonly language;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(30) readonly name;
  @IsOptional() @IsNumber() readonly channel;
  @IsOptional() readonly address;
  @IsOptional() @IsBoolean() readonly commander;
  @IsOptional() @IsNumber() readonly volume;
  @IsOptional() @IsString() readonly song;
}
