import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  IsIn,
} from 'class-validator';

export class BotEdit {
  @IsOptional()
  @IsIn(['en', 'pl', 'cs', 'da', 'fr', 'de', 'hu', 'ru', 'es', 'es-ar', 'th'])
  readonly language;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(30) readonly name;
  @IsOptional() @IsNumber() readonly channel;
  @IsOptional() readonly address;
}
