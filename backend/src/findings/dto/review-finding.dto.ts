import { IsEnum, IsString, ValidateIf, MinLength } from 'class-validator';

export enum ReviewActionEnum {
  accepted = 'accepted',
  edited = 'edited',
  dismissed = 'dismissed',
}

export class ReviewFindingDto {
  @IsEnum(ReviewActionEnum)
  action: ReviewActionEnum;

  @ValidateIf((o) => o.action === 'edited')
  @IsString()
  @MinLength(1)
  finalRecommendation?: string;

  @ValidateIf((o) => o.action === 'dismissed')
  @IsString()
  @MinLength(1, { message: 'Reviewer note is required when dismissing a finding' })
  reviewerNote?: string;
}
