import { IsString, IsIn, IsNumber, IsOptional } from 'class-validator';

export class RightsRequest {
  @IsString() @IsOptional() readonly useruid: string;
  @IsNumber() @IsOptional() readonly groupid: string;
  @IsString() @IsIn(['admin', 'user']) readonly level: string;
}
