import { IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  processName: string;

  @IsString()
  @MinLength(1)
  processOwner: string;
}
