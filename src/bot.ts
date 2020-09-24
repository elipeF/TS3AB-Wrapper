import { IsUUID } from 'class-validator';

export class Bot {
  @IsUUID() readonly id: string;
}
